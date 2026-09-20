extends SceneTree

var frame_count: int = 0
var root_node: Node

func _init():
	print("Inicializando captura de pantalla con paisaje alpino y dragón...")
	var main_scene = load("res://scenes/main.tscn")
	root_node = main_scene.instantiate()
	root.add_child(root_node)
	
	# Ocultar pantalla de título para la captura del juego
	var title = root_node.get_node_or_null("TitleScreen")
	if title:
		title.visible = false

func _process(delta: float) -> bool:
	frame_count += 1
	# Permitir que el mundo y la cámara se estabilicen varios cuadros
	if frame_count == 45:
		var img = root.get_texture().get_image()
		if img:
			img.save_png("res://screenshot.png")
			print("Captura guardada con éxito en res://screenshot.png")
		quit()
		return true
	return false
