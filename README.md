# Dragon Fury (Furia Dracónica) 🐉🔥

Videojuego 3D de acción y vuelo de dragones inspirado en **Rayman** y **Poki Dragon Simulator**, desarrollado con **Three.js, WebGL y Shaders GLSL**.

---

## 🎮 Controles y Jugabilidad

El juego incluye soporte simultáneo para **Mando de PlayStation (DualShock 4 / DualSense)** con **vibración háptica** y **Teclado + Ratón**:

### Mando de PlayStation (Recomendado)
| Botón | Acción |
| :--- | :--- |
| **Stick Izquierdo** | Dirección de vuelo y cabeceo (arriba / abajo) |
| **Stick Derecho** | **Cámara Libre Orbital 360°** alrededor del dragón |
| **R3 (Click Stick Der)** | Centrar la cámara detrás del dragón |
| **Gatillo R2** | **Aceleración rápida / Picada a alta velocidad** |
| **Gatillo L2** | Freno aéreo dinámico |
| **Cruz (✕)** | **Aletear / Ascender** (consume estamina) |
| **L1 / R1** | **Pirueta Tonel (Barrel Roll)** evasiva |
| **Cuadrado (■)** | **Aliento Continuo del Elemento Activo** |
| **Círculo (●)** | **Proyectil Explosivo Balístico** |
| **Triángulo (▲)** | **SUPERPODER DEFINITIVO** (cuando la esfera esté cargada) |
| **D-Pad Arriba** | Elemento **Fuego 🔥** (quema madera y vegetación) |
| **D-Pad Derecha** | Elemento **Hielo ❄️** (congela y apaga incendios) |
| **D-Pad Izquierda** | Elemento **Agua 💧** (torrente a presión) |
| **D-Pad Abajo** | Elemento **Plantas 🌿** (púas y raíces venenosas) |

### Teclado y Ratón
| Tecla / Control | Acción |
| :--- | :--- |
| **W / S** | Cabeceo (ascender / picada) |
| **A / D** | Viraje lateral |
| **Q / E** | Pirueta Tonel (Barrel Roll) |
| **Barra Espaciadora** | Aletear / Ascender |
| **Shift Izquierdo** | Acelerar / Picada a máxima velocidad |
| **Control Izquierdo** | Freno aéreo |
| **Movimiento Ratón** | **Cámara Libre Orbital 360°** (Click en pantalla para fijar cursor) |
| **Click Izquierdo** | Aliento Continuo del Elemento Activo |
| **Click Derecho** | Proyectil Explosivo Cargado |
| **Tecla F** | **SUPERPODER DEFINITIVO** |
| **Teclas 1, 2, 3, 4** | Cambiar a Fuego, Hielo, Agua o Plantas |

---

## 🌟 Características Destacadas

1. **Dos Dragones Jugables:**
   * **Ignisferus:** Acorazado carmesí de guerra, placas de obsidiana y embestidas devastadoras.
   * **Zephyron:** Draco sombrío esbelto de gran envergadura alar y recarga elemental veloz.
2. **Evolución en Tiempo Real (Metamorfosis):**
   * Tu dragón comienza como una **Cría Feroz** ágil.
   * Al derrotar caballeros y destruir torres ganas orbes de poder.
   * Al alcanzar los umbrales de puntos, el dragón desata un **estallido de luz cegadora y un rugido ancestral épico**, creciendo en tiempo real a **Dragón Joven** y luego a **Dragón Anciano Colosal**, desbloqueando proyectiles cargados y los **Superpoderes Definitivos**.
3. **Nieve Hiperrealista y Polvo de Vuelo:**
   * Shaders GLSL de nieve con destellos especulares de cristales de hielo.
   * Al volar a ras de la nieve o aterrizar, las alas levantan nubes de nieve en polvo blanco y dejan surcos en el suelo.
4. **Físicas de Combustión Realistas:**
   * Todo lo vegetal y de madera arde: árboles, empalizadas y torres de vigilancia se incendian, se ennegrecen progresivamente y colapsan en cenizas. Las rocas no se queman.
   * El hielo y el agua extinguen los incendios.
5. **HUD Minimalista PlayStation:**
   * Barras curvas de salud y estamina, rueda de los 4 elementos, medidor del orbe de superpoder y brújula.
6. **El Gran Jefe Final:**
   * En la cumbre nevada más alta mora el **Gran Dragón Titán de los 4 Elementos** con 3 fases de combate dinámicas.

---

## 🚀 Cómo Jugar

Simplemente haz doble clic en `start_game.bat` o ejecuta:

```powershell
python -m http.server 8080
```
Y abre tu navegador en `http://localhost:8080`.
