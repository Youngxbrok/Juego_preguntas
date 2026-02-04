class TriviaGame {
    constructor(config = {}) {
        // Validación de usuario
        this.verificarSesion();

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
            preguntasSesion: [],
            tiempoRestante: 0,
            intervaloID: null,
            tiempoActualPorPregunta: this.config.tiempoBase
        };

        // --- CORRECCIÓN DE SELECTORES AQUÍ ---
        // Usamos los IDs y Clases exactos de tu HTML
        this.dom = {
            // Antes buscabas por etiqueta, ahora usamos el ID directo
            pregunta: document.getElementById("texto-pregunta"), 
            
            // Usamos la clase especifica de los botones
            botones: document.querySelectorAll(".btn-opcion"), 
            
            puntaje: document.getElementById("puntaje"),
            tiempo: document.getElementById("tiempo"),
            mensaje: document.getElementById("mensaje"),
            nivel: document.getElementById("nivel"),
            btnReiniciar: document.getElementById("boton-reiniciar"),
            btnCerrar: document.getElementById("cerrar-sesion")
        };

        console.log("Juego inicializado. Elementos encontrados:", this.dom); // Debug
        this.initEvents();
    }

    verificarSesion() {
        if (!localStorage.getItem("usuario")) {
            window.location.href = "index.html";
        }
    }

    initEvents() {
        if (this.dom.btnReiniciar) {
            this.dom.btnReiniciar.addEventListener("click", () => this.iniciarJuego());
        }
        
        if (this.dom.btnCerrar) {
            this.dom.btnCerrar.addEventListener("click", () => {
                localStorage.clear();
                window.location.href = "index.html";
            });
        }

        // Asignar eventos a los botones de respuesta
        this.dom.botones.forEach((boton, index) => {
            boton.addEventListener("click", () => {
                console.log(`Click en botón ${index}`); // Debug para ver si funciona el click
                this.verificarRespuesta(index);
            });
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

    mezclarOpcionesDePregunta(pregunta) {
        const opcionesMezcladas = pregunta.opciones.map((texto, index) => ({
            texto,
            esCorrecta: index === pregunta.correcta
        }));
        
        const opcionesRandom = this.mezclarArray(opcionesMezcladas);
        
        pregunta.opciones = opcionesRandom.map(op => op.texto);
        pregunta.correcta = opcionesRandom.findIndex(op => op.esCorrecta);
    }

    iniciarJuego() {
        console.log("Iniciando juego...");
        
        // Verificamos si cargaron las preguntas
        if (!window.bancoPreguntas || window.bancoPreguntas.length === 0) {
            alert("Error CRÍTICO: No se encontraron preguntas. Revisa banco_pregunta.js");
            this.dom.pregunta.textContent = "Error: No hay preguntas cargadas.";
            return;
        }

        this.estado.puntaje = 0;
        this.estado.indicePregunta = 0;
        this.estado.tiempoActualPorPregunta = this.config.tiempoBase;
        
        const bancoCopia = JSON.parse(JSON.stringify(window.bancoPreguntas));
        this.estado.preguntasSesion = this.mezclarArray(bancoCopia).slice(0, this.config.preguntasPorPartida);

        this.actualizarPuntajeUI();
        this.dom.mensaje.textContent = "";
        this.dom.btnReiniciar.style.display = "none";
        this.toggleBotones(true);
        
        // ¡Aquí es donde se actualiza la pantalla!
        if (this.estado.preguntasSesion.length > 0) {
            this.renderizarPregunta();
        } else {
            console.error("El banco de preguntas estaba vacío después de filtrar.");
        }
    }

    renderizarPregunta() {
        const preguntaActual = this.estado.preguntasSesion[this.estado.indicePregunta];
        this.mezclarOpcionesDePregunta(preguntaActual);

        // Actualizar texto en pantalla
        this.dom.pregunta.textContent = preguntaActual.pregunta;
        
        // Actualizar botones
        this.dom.botones.forEach((boton, index) => {
            const opcionTexto = preguntaActual.opciones[index];
            if (opcionTexto) {
                boton.textContent = opcionTexto;
                boton.style.display = "inline-block"; // Asegura que sea visible
                boton.disabled = false;
                boton.className = "btn-opcion"; // Resetea clases (quita colores previos)
            } else {
                boton.style.display = "none";
            }
        });

        // Nivel y tiempo
        if (this.estado.indicePregunta > 0 && this.estado.indicePregunta % 3 === 0) {
            this.estado.tiempoActualPorPregunta = Math.max(5, this.estado.tiempoActualPorPregunta - this.config.reduccionTiempoNivel);
        }
        
        const nivelCalculado = Math.floor((30 - this.estado.tiempoActualPorPregunta) / 10) + 1;
        this.dom.nivel.textContent = `Nivel ${nivelCalculado} – Pregunta ${this.estado.indicePregunta + 1} / ${this.config.preguntasPorPartida}`;

        this.iniciarTemporizador();
    }

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
            // Marcamos en rojo todas para indicar fallo
            this.dom.botones.forEach(btn => btn.style.background = "#ff3b2f");
        } else if (esCorrecta) {
            this.estado.puntaje += this.config.puntosPorCorrecta;
            this.dom.mensaje.textContent = "✅ ¡Correcto!";
            this.actualizarPuntajeUI();
            // Pintamos el botón presionado de verde (podríamos mejorarlo sabiendo cuál fue)
             this.dom.botones.forEach(btn => {
                 if(!btn.disabled) btn.style.background = "#00c6ff"; // Reset visual rápido
             });
        } else {
            this.dom.mensaje.textContent = "❌ Incorrecto";
        }

        setTimeout(() => {
            // Resetear estilos de botones antes de la siguiente
            this.dom.botones.forEach(btn => btn.style.background = ""); 
            this.siguientePregunta();
        }, 1200);
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

    actualizarPuntajeUI() { 
        this.dom.puntaje.textContent = this.estado.puntaje; 
    }
    
    toggleBotones(habilitar) { 
        this.dom.botones.forEach(btn => btn.disabled = !habilitar); 
    }
}

// Inicialización segura
window.onload = () => {
    // Pequeño delay para asegurar carga del DOM
    setTimeout(() => {
        const juego = new TriviaGame();
        juego.iniciarJuego();
    }, 100);
};