const express = require("express");
const createConnection = require("./src/config/database.js");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORTA || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // Para interpretar dados de formulários
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 1,
      httpOnly: true,
    },
    name: "customSession",
  })
);
app.use(cookieParser());

// cria a conexão com o MYSQL, já está ocnfigurado
const getDbConnection = async () => {
  const conn = await createConnection();
  return conn;
};

const generateUniqueSessionId = async (email, password) => {
  const time = new Date().getMilliseconds();
  const resultado = `${email}-${password}${time}`;

  const hash = await bcrypt.hash(resultado, 5);
  return hash;
};

// Função para criar uma nova sessão
const createSession = async (connection, userId, email, password) => {
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // Expira em 3 horas
  const sessionId = await generateUniqueSessionId(email, password); // Você pode usar uma função para gerar um ID único

  await connection.query(
    `INSERT INTO session (id_session, user_id, created_at, expires_at, valid) VALUES (?, ?, NOW(), ?, TRUE)`,
    [sessionId, userId, expiresAt]
  );

  return sessionId;
};

function checkSession(req, res, next) {
  // Verificando se a sessão existe
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next(); // Sessão encontrada, continua para a próxima rota
}

// GET PAGE
app.get("/", (req, res) => {
  res.redirect("/login");
});
// GET PAGE
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/src/views/login.html");
});

// GET PAGE
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/src/views/register.html");
});

// GET PAGE
app.get("/dashboard", async (req, res) => {
  const { session_id } = req.cookies;
  if (!session_id) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const connection = await getDbConnection();
  const [sessions] = await connection.query(
    "SELECT * FROM session WHERE id_session = ? AND expires_at > NOW() AND valid = TRUE",
    [session_id]
  );

  if (sessions.length === 0) {
    return res.redirect("/login");
  }

  res.sendFile(__dirname + "/src/views/dashboard.html");
});

// POST
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send("Nome, email e senha são obrigatórios.");
  }

  const connection = await getDbConnection();

  const [rows] = await connection.query("SELECT * FROM user WHERE email = ?", [
    email,
  ]);

  if (rows.length > 0) {
    return res.status(400).json({ message: "Usuário já registrado" });
  }

  const hashPass = await bcrypt.hashSync(password, 5);

  await connection.query(
    "INSERT INTO user (name, email, password) VALUES (?, ?, ?);",
    [name, email, hashPass]
  );

  res.redirect("/login");
});

// POST
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Campos inválidos" });
  }

  const connection = await getDbConnection();

  const [rows] = await connection.query("SELECT * FROM user WHERE email = ?", [
    email,
  ]);

  if (rows.length === 0) {
    return res.status(400).json({ message: "Usuário não encontrado" });
  }

  const user = rows[0];

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: "Senha inválida!" });

  const sessionId = await createSession(
    connection,
    user.iduser,
    user.email,
    user.password
  );

  res.cookie("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Para HTTPS em produção
    maxAge: 3 * 60 * 60 * 1000, // 3 horas de duração
  });

  // Debugging: Verificar se a sessão foi criada corretamente
  console.log("Sessão criada:", req.session);

  res.redirect("/dashboard");
});

app.get("/logout", async (req, res) => {
  const { session_id } = req.cookies;

  if (!session_id) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    const connection = await getDbConnection();

    // Marcar a sessão como inválida no banco de dados
    await connection.query(
      "UPDATE session SET valid = false WHERE id_session = ?",
      [session_id]
    );

    // Destruir o cookie de sessão
    res.clearCookie("session_id", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.redirect("/login"); // Redirecionar para a página de login após logout
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    res.status(500).json({ message: "Erro ao fazer logout" });
  }
});

// READ
app.get("/api/usuarios", async (req, res) => {
  const { session_id } = req.cookies;
  if (!session_id) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const connection = await getDbConnection();
  const [sessions] = await connection.query(
    "SELECT * FROM session WHERE id_session = ? AND expires_at > NOW() AND valid = TRUE",
    [session_id]
  );

  if (sessions.length === 0) {
    return res.status(401).json({ message: "Sessão inválida ou expirada" });
  }
  const [rows] = await connection.query("SELECT iduser, name, email FROM user");

  res.json(rows);
});

// UPDATE
app.put("/api/usuarios/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;

  // Validar os dados
  if (!name || !email) {
    return res.status(400).json({ message: "Campos obrigatórios faltando" });
  }

  try {
    const connection = await getDbConnection();

    // Atualizar o usuário (substituindo completamente os dados)
    await connection.query(
      "UPDATE user SET name = ?, email = ? WHERE iduser = ?",
      [name, email, userId]
    );

    res.status(200).json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar o usuário" });
  }
});

// DELETE
app.delete("/api/usuarios/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const conn = await getDbConnection();

    const [user] = await conn.query("SELECT * FROM user WHERE iduser=?", [
      userId,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await conn.query("DELETE FROM session WHERE user_id=?", [userId]);
    await conn.query("DELETE FROM user WHERE iduser=?", [userId]);

    return res.status(200).json({ message: "Usuário excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ message: "Erro ao excluir o usuário." });
  }
});

const horaAtual = new Date().toLocaleTimeString();
const dataAtual = new Date().toLocaleDateString();

app.listen(port, () => {
  console.log("--- Iniciando ---\n");

  console.log(` [DATA - HORA]: ${dataAtual} ${horaAtual}`);
  console.log(`\nServidor rodando na ${port}.\n`);
});
