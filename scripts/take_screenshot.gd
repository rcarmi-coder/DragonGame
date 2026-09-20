extends SceneTree

var frame_count: int = 0

func _init():
	print("Tomando captura de pantalla de la escena principal...")
	var main_scene = load("res://scenes/main.tscn")
	var root_node = main_scene.instantiate()
	root.add_child(root_node)

func _process(delta: float) -> bool:
	frame_count += 1
	if frame_count > 30:
		var img = root.get_texture().get_image()
		if img:
			img.save_png("res://screenshot.png")
			print("Captura guardada con éxito en screenshot.png")
		quit()
		return true
	return false
