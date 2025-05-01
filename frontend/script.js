const chatContainer = document.getElementById("chat-container");
const inputForm = document.getElementById("input-form");
const userInput = document.getElementById("user-input");
const datePicker = document.getElementById("date-picker");

let step = 0;
let formData = {};
let esperandoConfirmacion = false;

const preguntas = [
  { tipo: "texto", mensaje: "¡Hola! 😊 ¿Cuál es tu nombre y apellido?", campo: "nombre" },
  { tipo: "texto", mensaje: "Perfecto, te pediré algunos datos para poder encontrar la mejor opción de agenda para ti. ¿Cuál es tu RUT?", campo: "rut", validar: validarRUT },
  { tipo: "texto", mensaje: "¿Cuál es tu correo electrónico?", campo: "correo", validar: validarEmail },
  {
    tipo: "opciones",
    mensaje: "¿Cuál es tu previsión?",
    opciones: ["Isapre", "Fonasa", "Particular"],
    campo: "prevision"
  },
  {
    tipo: "opciones",
    mensaje: "Todos estos datos son los exigidos por las clínicas para agendar 😉​. ¿Cuál es tu Isapre?",
    opciones: ["Banmédica", "Cruz Blanca", "Consalud", "Colmena", "Nueva Más Vida", "Vida Tres", "Esencial"],
    campo: "isapre",
    condicion: (datos) => datos.prevision === "Isapre"
  },
  {
    tipo: "checkbox",
    mensaje: "¿En qué clínicas quieres atenderte? (Puedes elegir hasta 3)",
    opciones: [
      "Clínica Alemana",
      "Clínica Las Condes",
      "Clínica UC San Carlos",
      "Clínica UC Christus",
      "Clínica MEDS",
      "Clínica Santa María",
      "Clínica Indisa Providencia",
      "Clínica Indisa Maipú",
      "Clínica Redsalud Providencia",
      "Clínica Redsalud Vitacura",
      "Clínica Dávila Recoleta",
      "Clínica Dávila Vespucio",
      "Clínica Bupa",
      "Otra",
    ],
    campo: "clinicas"
  },
  {
    tipo: "opciones",
    mensaje: "¿Qué especialidad estás buscando?",
    opciones: [
      "Medicina general",
      "Ginecología",
      "Pediatría",
      "Traumatología",
      "Oftalmología",
      "Psiquiatría",
      "Cardiología",
      "Dermatología",
      "Gastroenterología",
      "Endocrinología",
      "Neurología",
      "Reumatología",
      "Urología",
      "Otorrinolaringología"
    ],
    campo: "especialidad"
  },
  {
    tipo: "opciones",
    mensaje: "¿Tienes un médico de preferencia? 👨🏻‍⚕️​",
    opciones: ["Sí", "No"],
    campo: "tieneMedico"
  },
  {
    tipo: "texto",
    mensaje: "Escribe el nombre del médico",
    campo: "medico",
    condicion: (datos) => datos.tieneMedico === "Sí"
  },
  {
    tipo: "opciones",
    mensaje: "¿Prefieres la hora lo antes posible o en una fecha específica? 🕝​",
    opciones: ["Lo antes posible", "Fecha específica"],
    campo: "preferenciaHora"
  },
  {
    tipo: "fecha",
    mensaje: "Selecciona la fecha que prefieras (si haces click en el calendario se despliega uno):",
    campo: "fecha",
    condicion: (datos) => datos.preferenciaHora === "Fecha específica"
  },
  {
    tipo: "opciones",
    mensaje: "¿Prefieres horario mañana o tarde?",
    opciones: ["Mañana", "Tarde"],
    campo: "horario",
    condicion: (datos) => datos.preferenciaHora === "Fecha específica"
  }
];

function agregarMensaje(texto, clase) {
  const msg = document.createElement("div");
  msg.className = `message ${clase}`;
  msg.innerHTML = texto.replace(/\n/g, "<br>");
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function mostrarPregunta() {
  const pregunta = preguntas[step];
  if (!pregunta) return;

  if (pregunta.condicion && !pregunta.condicion(formData)) {
    step++;
    mostrarPregunta();
    return;
  }

  let texto = pregunta.mensaje;

  userInput.style.display = "none";
  datePicker.style.display = "none";

  if (pregunta.tipo === "texto" || pregunta.tipo === "opciones") {
    if (pregunta.tipo === "opciones") {
      texto += "<br>" + pregunta.opciones.map((op, i) => `${i + 1}) ${op}`).join("<br>");
    }
    agregarMensaje(texto, "bot");
    userInput.value = "";
    userInput.style.display = "block";
    userInput.focus();
  } else if (pregunta.tipo === "fecha") {
    agregarMensaje(texto, "bot");
    datePicker.value = "";
    datePicker.style.display = "block";
  } else if (pregunta.tipo === "checkbox") {
    agregarMensaje(texto, "bot");
    const opcionesHtml = pregunta.opciones
      .map((op) => `<label><input type="checkbox" name="clinica" value="${op}"> ${op}</label>`)
      .join("<br>");
    const wrapper = document.createElement("div");
    wrapper.className = "message bot";
    wrapper.innerHTML = opcionesHtml;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

inputForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const pregunta = preguntas[step];
  let respuesta = "";

  if (esperandoConfirmacion) {
    const valor = userInput.value.trim();
    if (valor !== "1" && valor !== "2") {
      agregarMensaje("Por favor responde con 1) Sí o 2) No.", "bot");
      return;
    }
    const confirmacion = valor === "1" ? "Sí" : "No";
    agregarMensaje(confirmacion, "user");

    // Registrar la respuesta de confirmación en el objeto de datos
    formData["agendarPorTi"] = confirmacion;

    // Enviar los datos acumulados al servidor al confirmar
    enviarDatosAlServidor(formData);
    
    agregarMensaje("¡Gracias por confiar en nosotros! 💙. Pronto nos contactaremos por correo para darte información de tu solicitud.", "bot");
    inputForm.style.display = "none";
    return;
  }

  if (pregunta.tipo === "fecha") {
    if (!datePicker.value) return;
    const partes = datePicker.value.split("-");
    if (partes.length !== 3) return;
    const fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    respuesta = fechaFormateada;
    formData[pregunta.campo] = fechaFormateada;
  } else if (pregunta.tipo === "checkbox") {
    const seleccionados = Array.from(document.querySelectorAll('input[name="clinica"]:checked')).map(input => input.value);
    if (seleccionados.length === 0 || seleccionados.length > 3) {
      agregarMensaje("Selecciona entre 1 y 3 clínicas, por favor.", "bot");
      return;
    }
    respuesta = seleccionados;
  } else {
    respuesta = userInput.value.trim();
    if (!respuesta) return;
  }

  if (pregunta.tipo === "opciones") {
    const index = parseInt(respuesta);
    if (isNaN(index) || index < 1 || index > pregunta.opciones.length) {
      agregarMensaje("Por favor responde con el número correspondiente a una opción válida.", "bot");
      return;
    }
    respuesta = pregunta.opciones[index - 1];
  }

  if (pregunta.validar && !pregunta.validar(respuesta)) {
    agregarMensaje("El formato que ingresaste no es válido. Intenta nuevamente.", "bot");
    return;
  }

  if (pregunta.tipo === "checkbox") {
    agregarMensaje(respuesta.join(", "), "user");
  } else {
    agregarMensaje(respuesta, "user");
  }

  if (pregunta.campo && pregunta.tipo !== "fecha") {
    formData[pregunta.campo] = respuesta;
  }

  if (pregunta.campo === "preferenciaHora" && respuesta === "Lo antes posible") {
    userInput.value = "";
    agregarMensaje("¿Quieres que agendemos por ti?<br>1) Sí<br>2) No", "bot");
    esperandoConfirmacion = true;
    return;
  }

  if (pregunta.campo === "horario") {
    userInput.value = "";
    agregarMensaje("¿Quieres que agendemos por ti?<br>1) Sí<br>2) No", "bot");
    esperandoConfirmacion = true;
    return;
  }

  step++;

  // Si se han respondido todas las preguntas, envía los datos al servidor.
  if (step === preguntas.length) {
    enviarDatosAlServidor(formData);
  } else {
    mostrarPregunta();
  }
});

mostrarPregunta();

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarRUT(rut) {
  rut = rut.replace(/\./g, '').replace('-', '');
  if (rut.length < 8 || rut.length > 9) return false;
  let cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  let dvEsperado = 11 - (suma % 11);
  dvEsperado = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();
  return dv === dvEsperado;
}

function enviarDatosAlServidor(datosFormulario) {
  fetch('http://localhost:3001/api/form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosFormulario)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Respuesta del servidor:', data);
    agregarMensaje('¡Solicitud enviada exitosamente! Nos pondremos en contacto.', 'bot');
  })
  .catch(error => {
    console.error('Error al enviar datos:', error);
    agregarMensaje('Error al enviar la solicitud. Intenta nuevamente.', 'bot');
  });
}
