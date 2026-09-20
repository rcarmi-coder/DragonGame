extends SceneTree

var frame_count: int = 0
var root_node: Node

func _init():
	print("Capturando pantalla de título...")
	var main_scene = load("res://scenes/main.tscn")
	root_node = main_scene.instantiate()
	root.add_child(root_node)

func _process(delta: float) -> bool:
	frame_count += 1
	if frame_count == 30:
		var img = root.get_texture().get_image()
		if img:
			img.save_png("res://screenshot_title.png")
			print("Captura guardada en screenshot_title.png")
		quit()
		return true
	return false
