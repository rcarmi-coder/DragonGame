extends SceneTree

var frame_count: int = 0
var root_node: Node

func _init():
	print("Capturando dragón posado en tierra...")
	var main_scene = load("res://scenes/main.tscn")
	root_node = main_scene.instantiate()
	root.add_child(root_node)
	
	var title = root_node.get_node_or_null("TitleScreen")
	if title: title.visible = false

func _process(delta: float) -> bool:
	frame_count += 1
	var dragon = root_node.dragon_p1 if "dragon_p1" in root_node else null
	var world = root_node.viewport_p1.get_node_or_null("World")
	if dragon and world:
		var ground_y = world.get_height(0.0, 0.0)
		dragon.state = dragon.FlightState.LANDED
		dragon.global_position = Vector3(0, ground_y + 1.2 * dragon.scale.x, 0)
		dragon.current_speed = 0.0
	
	if frame_count == 35:
		var img = root.get_texture().get_image()
		if img:
			img.save_png("res://screenshot_landed.png")
			print("Captura guardada en screenshot_landed.png")
		quit()
		return true
	return false
