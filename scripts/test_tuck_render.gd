extends SceneTree

var frame = 0
var dragon: Node3D

func _init():
	var scene = load("res://scenes/dragon.tscn")
	dragon = scene.instantiate()
	root.add_child(dragon)
	dragon.position = Vector3(0, 0, 0)
	
	var cam = Camera3D.new()
	# View from behind and slightly to the side to see wings, joints and legs
	cam.position = Vector3(5, 3, 9)
	cam.look_at_from_position(Vector3(5, 3, 9), Vector3(0, 0, 0), Vector3.UP)
	root.add_child(cam)
	
	var light = DirectionalLight3D.new()
	light.position = Vector3(10, 25, 10)
	light.look_at_from_position(Vector3(10, 25, 10), Vector3.ZERO, Vector3.UP)
	root.add_child(light)

func _process(delta: float) -> bool:
	frame += 1
	var skel: Skeleton3D = null
	for c in dragon.find_children("*", "Skeleton3D", true):
		skel = c
		break
	
	if skel:
		# Tuck front legs: bones 8, 13
		# Hind legs: bones 48, 53
		# In Godot 4, let's scale leg bones down and rotate them backwards
		for b in [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 48, 49, 50, 51, 52, 53, 54, 55, 56]:
			skel.set_bone_pose_scale(b, Vector3(0.25, 0.25, 0.25))
	
	if frame == 25:
		var img = root.get_texture().get_image()
		if img:
			img.save_png("res://test_tucked_legs.png")
			print("Saved test_tucked_legs.png")
		quit()
		return true
	return false
