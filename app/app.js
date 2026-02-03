class TriviaGame {
    constructor(preguntas, config = {}) {
        // ... (Configuración igual que antes) ...
        this.config = {
            tiempoBase: 30,
            preguntasPorPartida: 9,
            puntosPorCorrecta: 10,
            reduccionTiempoNivel: 10,
            ...config
        };

        this.estado = {
            puntaje: 0,
            indicePregunta: 0,
            preguntasSesion: [], // Aquí guardaremos las preguntas ya mezcladas
            tiempoRestante: 0,
            intervaloID: null,
            tiempoActualPorPregunta: this.config.tiempoBase
        };

        // ... (Referencias al DOM igual que antes) ...
        this.dom = {
            pregunta: document.querySelector(".zona_preguntas_respuestas article"),
            botones: document.querySelectorAll(".zona_preguntas_respuestas button"),
            // ... resto de selectores ...
            puntaje: document.getElementById("puntaje"),
            tiempo: document.getElementById("tiempo"),
            mensaje: document.getElementById("mensaje"),
            nivel: document.getElementById("nivel"),
            btnReiniciar: document.getElementById("boton-reiniciar"),
            btnCerrar: document.getElementById("cerrar-sesion")
        };

        this.initEvents();
    }

    // ... (initEvents y mezclarArray igual que antes) ...
    initEvents() {
        this.dom.btnReiniciar.addEventListener("click", () => this.iniciarJuego());
        this.dom.btnCerrar.addEventListener("click", () => {
             localStorage.clear();
             alert("Cierre de sesión correcto");
             window.location.href = "index.html";
        });
        this.dom.botones.forEach((boton, index) => {
            boton.addEventListener("click", () => this.verificarRespuesta(index));
        });
    }

    mezclarArray(array) {
        const copia = [...array];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    // ==========================================
    // NUEVA LÓGICA INTEGRADA AQUÍ 👇
    // ==========================================
    mezclarOpcionesDePregunta(pregunta) {
        // 1. Creamos objetos temporales para no perder la correcta
        const opcionesMezcladas = pregunta.opciones.map((texto, index) => ({
            texto,
            esCorrecta: index === pregunta.correcta
        }));

        // 2. Usamos el mezclador de la clase (Fisher-Yates) para mayor aleatoriedad
        // (O puedes usar .sort(() => Math.random() - 0.5) si prefieres)
        const opcionesRandom = this.mezclarArray(opcionesMezcladas);

        // 3. Actualizamos la pregunta con el nuevo orden
        pregunta.opciones = opcionesRandom.map(op => op.texto);
        pregunta.correcta = opcionesRandom.findIndex(op => op.esCorrecta);
    }

    iniciarJuego() {
        this.estado.puntaje = 0;
        this.estado.indicePregunta = 0;
        this.estado.tiempoActualPorPregunta = this.config.tiempoBase;
        
        // Clonamos las preguntas para no modificar el banco original "bancoPreguntas"
        // Esto es importante porque vamos a modificar el orden de las opciones internamente
        const bancoCopia = JSON.parse(JSON.stringify(window.bancoPreguntas || []));
        
        this.estado.preguntasSesion = this.mezclarArray(bancoCopia).slice(0, this.config.preguntasPorPartida);

        this.actualizarPuntajeUI();
        this.dom.mensaje.textContent = "";
        this.dom.btnReiniciar.style.display = "none";
        this.toggleBotones(true);
        
        if (this.estado.preguntasSesion.length > 0) {
            this.renderizarPregunta();
        }
    }

    renderizarPregunta() {
        const preguntaActual = this.estado.preguntasSesion[this.estado.indicePregunta];

        // 👇 APLICAMOS LA MEZCLA JUSTO ANTES DE MOSTRAR 👇
        this.mezclarOpcionesDePregunta(preguntaActual);

        // UI Textos
        this.dom.pregunta.textContent = preguntaActual.pregunta;
        this.dom.mensaje.textContent = "";

        // Lógica de dificultad (tiempo)
        if (this.estado.indicePregunta > 0 && this.estado.indicePregunta % 3 === 0) {
            this.estado.tiempoActualPorPregunta = Math.max(5, this.estado.tiempoActualPorPregunta - this.config.reduccionTiempoNivel);
        }

        // Mostrar Nivel
        const nivelCalculado = Math.floor((30 - this.estado.tiempoActualPorPregunta) / 10) + 1;
        this.dom.nivel.textContent = `Nivel ${nivelCalculado} – Pregunta ${this.estado.indicePregunta + 1} / ${this.config.preguntasPorPartida}`;

        // Renderizar Botones
        this.dom.botones.forEach((boton, index) => {
            const opcionTexto = preguntaActual.opciones[index];
            if (opcionTexto) {
                boton.textContent = opcionTexto;
                boton.style.display = "inline-block";
                boton.disabled = false;
                boton.className = ""; 
            } else {
                boton.style.display = "none";
            }
        });

        this.iniciarTemporizador();
    }

    // ... (El resto de métodos: iniciarTemporizador, verificarRespuesta, etc. siguen igual) ...
    iniciarTemporizador() {
        clearInterval(this.estado.intervaloID);
        this.estado.tiempoRestante = this.estado.tiempoActualPorPregunta;
        this.dom.tiempo.textContent = this.estado.tiempoRestante;

        this.estado.intervaloID = setInterval(() => {
            this.estado.tiempoRestante--;
            this.dom.tiempo.textContent = this.estado.tiempoRestante;

            if (this.estado.tiempoRestante <= 0) {
                this.finalizarTurno(false, true); 
            }
        }, 1000);
    }

    verificarRespuesta(indiceElegido) {
        const pregunta = this.estado.preguntasSesion[this.estado.indicePregunta];
        const esCorrecta = indiceElegido === pregunta.correcta;
        this.finalizarTurno(esCorrecta, false);
    }

    finalizarTurno(esCorrecta, porTiempo) {
        clearInterval(this.estado.intervaloID);
        this.toggleBotones(false); 

        if (porTiempo) {
            this.dom.mensaje.textContent = "⏱️ Tiempo agotado";
        } else if (esCorrecta) {
            this.estado.puntaje += this.config.puntosPorCorrecta;
            this.dom.mensaje.textContent = "✅ ¡Correcto!";
            this.actualizarPuntajeUI();
        } else {
            this.dom.mensaje.textContent = "❌ Incorrecto";
        }

        setTimeout(() => this.siguientePregunta(), 1200);
    }
    
    siguientePregunta() {
        this.estado.indicePregunta++;
        if (this.estado.indicePregunta >= this.estado.preguntasSesion.length) {
            this.terminarJuego();
        } else {
            this.renderizarPregunta();
        }
    }

    terminarJuego() {
        clearInterval(this.estado.intervaloID);
        this.dom.pregunta.textContent = "🎉 ¡Juego terminado!";
        this.dom.mensaje.textContent = `Puntaje final: ${this.estado.puntaje}`;
        this.dom.nivel.textContent = "";
        this.dom.botones.forEach(btn => btn.style.display = "none");
        this.dom.btnReiniciar.style.display = "inline-block";
    }

    actualizarPuntajeUI() { this.dom.puntaje.textContent = this.estado.puntaje; }
    toggleBotones(habilitar) { this.dom.botones.forEach(btn => btn.disabled = !habilitar); }
}

window.onload = () => {
    const juego = new TriviaGame();
    juego.iniciarJuego();
};