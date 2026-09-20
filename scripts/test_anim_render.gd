extends SceneTree

var frame_count: int = 0
var anim_player: AnimationPlayer = null

func _init():
	var scene = load("res://scenes/dragon.tscn")
	var dragon = scene.instantiate()
	root.add_child(dragon)
	dragon.position = Vector3(0, 0, 0)
	
	var cam = Camera3D.new()
	cam.position = Vector3(0, 5, -15)
	cam.look_at(Vector3(0, 2, 0), Vector3.UP)
	root.add_child(cam)
	
	var light = DirectionalLight3D.new()
	light.position = Vector3(10, 20, 10)
	light.look_at(Vector3.ZERO, Vector3.UP)
	root.add_child(light)
	
	for c in dragon.find_children("*", "AnimationPlayer", true):
		anim_player = c
		break
	if anim_player:
		# Test mo_0077_btl_2101
		anim_player.play("Armature|Armature|mo_0077_btl_2101|Base Layer")
		print("Playing mo_0077_btl_2101")

func _process(delta: float) -> bool:
	frame_count += 1
	if frame_count == 20:
		var img = root.get_texture().get_image()
		if img:
			img.save_png("res://test_btl_2101.png")
			print("Saved test_btl_2101.png")
		quit()
		return true
	return false
