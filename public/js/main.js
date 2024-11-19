window.onload = async () => {
  try {
    const response = await fetch("/api/usuarios", {
      method: "GET",
    });

    if (response.ok) {
      const users = await response.json();

      console.log("Dashboard carregado:", users);
      const userList = document.getElementById("user-list");

      users.forEach((user) => {
        const li = document.createElement("li");
        const btnDel = document.createElement("button");
        const btnAlt = document.createElement("button");
        const btnSave = document.createElement("button");
        const btnCan = document.createElement("button");
        const divBtn = document.createElement("div");
        const divContent = document.createElement("div");
        const divContentTitle = document.createElement("div");
        const divContentName = document.createElement("div");
        const divContentEmail = document.createElement("div");
        const h2Title = document.createElement("h2");
        const h2ID = document.createElement("h2");
        const nomeLabel = document.createElement("p");
        const nomeP = document.createElement("p");
        const emailLabel = document.createElement("p");
        const emailP = document.createElement("p");
        const inputName = document.createElement("input");
        const inputEmail = document.createElement("input");

        li.appendChild(divContent);
        li.appendChild(divBtn);
        divBtn.appendChild(btnDel);
        divBtn.appendChild(btnAlt);
        divBtn.appendChild(btnCan);
        divBtn.appendChild(btnSave);
        divContent.appendChild(divContentTitle);
        divContent.appendChild(divContentName);
        divContent.appendChild(divContentEmail);
        divContentTitle.appendChild(h2Title);
        divContentTitle.appendChild(h2ID);
        divContentName.appendChild(nomeLabel);
        divContentName.appendChild(nomeP);
        // divContentName.appendChild(inputName);
        divContentEmail.appendChild(emailLabel);
        divContentEmail.appendChild(emailP);
        // divContentEmail.appendChild(inputEmail);
        li.classList.add("container_list");
        divContent.classList.add("div__cont_container");
        divBtn.classList.add("div__btn_container");
        h2Title.innerHTML = "<strong>User ID: </strong>";
        nomeLabel.innerHTML = "<strong>Nome: </strong>";
        emailLabel.innerHTML = "<strong>E-mail: </strong>";
        h2ID.textContent = `${user.iduser}`;
        nomeP.textContent = `${user.name}`;
        emailP.textContent = `${user.email}`;
        inputName.value = nomeP.innerText;
        inputEmail.value = emailP.innerText;
        inputName.setAttribute("type", "text");
        inputName.setAttribute("name", "name");
        inputEmail.setAttribute("type", "email");
        inputEmail.setAttribute("name", "email");
        divContentTitle.classList.add("cont__list_user");
        divContentName.classList.add("cont__list_user");
        divContentEmail.classList.add("cont__list_user");
        btnCan.classList.add("btn__cancelar");
        btnDel.classList.add("btn__excluir");

        btnAlt.textContent = "Alterar";
        btnDel.textContent = "Excluir";
        btnSave.textContent = "Salvar";
        btnCan.textContent = "Cancelar";

        btnCan.style.display = "none";
        btnSave.style.display = "none";
        // inputName.style.display = "none";
        // inputEmail.style.display = "none";

        btnAlt.addEventListener("click", async function () {
          btnAlt.style.display = "none";
          btnDel.style.display = "none";
          btnCan.style.display = "block";
          btnSave.style.display = "block";

          if (divContent.contains(nomeP)) {
            divContentName.replaceChild(inputName, nomeP);
          }
          if (divContent.contains(emailP)) {
            divContentEmail.replaceChild(inputEmail, emailP);
          }
        });
        btnSave.addEventListener("click", async function () {
          console.log(inputName.value);
          console.log(inputEmail.value);

          try {
            const alterarResponse = await fetch(
              `/api/usuarios/${user.iduser}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json", // Envia os dados como JSON
                },
                body: JSON.stringify({
                  name: inputName.value,
                  email: inputEmail.value,
                }),
              }
            );

            if (alterarResponse.ok) {
              alert(`Usuário ${user.name} alterado com sucesso!`);
              nomeP.textContent = inputName.value;
              emailP.textContent = inputEmail.value;

              // Substitui os campos editáveis pelos valores atualizados
              btnCan.style.display = "none";
              btnSave.style.display = "none";
              btnAlt.style.display = "block";
              btnDel.style.display = "block";

              if (divContent.contains(inputName)) {
                divContentName.replaceChild(nomeP, inputName);
              }
              if (divContent.contains(inputEmail)) {
                divContentEmail.replaceChild(emailP, inputEmail);
              }
            } else {
              alert("Erro ao alterar o usuário");
            }
          } catch (error) {
            console.error("Erro na alteração do usuário:", error);
            alert("Erro ao tentar alterar o usuário.");
          }
        });
        btnCan.addEventListener("click", function () {
          btnCan.style.display = "none";
          btnSave.style.display = "none";
          btnAlt.style.display = "block";
          btnDel.style.display = "block";

          if (divContent.contains(inputName)) {
            divContentName.replaceChild(nomeP, inputName);
          }
          if (divContent.contains(inputEmail)) {
            divContentEmail.replaceChild(emailP, inputEmail);
          }
        });
        btnDel.onclick = async function () {
          try {
            const deleteResponse = await fetch(`/api/usuarios/${user.iduser}`, {
              method: "DELETE",
            });

            if (deleteResponse.ok) {
              alert(`Usuário ${user.name} excluído com sucesso!`);
              // Remover o item da lista após exclusão
              li.remove();
            } else {
              alert("Erro ao excluir o usuário");
            }
          } catch (error) {
            console.error("Erro na exclusão do usuário:", error);
            alert("Erro ao tentar excluir o usuário.");
          }
        };

        userList.appendChild(li);
      });
    } else {
      alert("Erro ao carregar o dashboard");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
};
