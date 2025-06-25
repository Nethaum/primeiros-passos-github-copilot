document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Função para buscar atividades na API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Limpa a mensagem de carregamento
      activitiesList.innerHTML = "";

      // Popula a lista de atividades
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Cria a lista de participantes
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div>
              <strong>Participantes:</strong>
              <ul class="participants-list no-marker">
                ${details.participants.map(p => `
                  <li>
                    <span>${p}</span>
                    <button class="remove-participant" data-activity="${name}" data-email="${p}" title="Remover" aria-label="Remover participante">
                      🗑️
                    </button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `<div class="info"><em>Nenhum participante inscrito ainda.</em></div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Agenda:</strong> ${details.schedule}</p>
          <p><strong>Disponibilidade:</strong> ${spotsLeft} vagas disponíveis</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Adiciona opção ao select
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Falha ao carregar atividades. Por favor, tente novamente mais tarde.</p>";
      console.error("Erro ao buscar atividades:", error);
    }
  }

  // Função para remover participante
  async function removeParticipant(activity, email) {
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/remove?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
      const result = await response.json();
      if (response.ok) {
        fetchActivities();
      } else {
        alert(result.detail || "Erro ao remover participante.");
      }
    } catch (error) {
      alert("Erro ao remover participante.");
      console.error(error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Atualiza a lista de atividades após inscrição
      } else {
        messageDiv.textContent = result.detail || "Ocorreu um erro";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Falha na inscrição. Por favor, tente novamente.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Erro na inscrição:", error);
    }
  });

  // Delegação de evento para remover participante
  activitiesList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-participant")) {
      const activity = e.target.getAttribute("data-activity");
      const email = e.target.getAttribute("data-email");
      if (confirm(`Remover participante ${email} da atividade ${activity}?`)) {
        removeParticipant(activity, email);
      }
    }
  });

  // Inicializa o aplicativo
  fetchActivities();
});
