extends SceneTree

func _init():
	var scene = load("res://scenes/dragon.tscn")
	var dragon = scene.instantiate()
	root.add_child(dragon)
	
	var skel: Skeleton3D = null
	for c in dragon.find_children("*", "Skeleton3D", true):
		skel = c
		break
		
	if skel:
		print("Testing bone manipulation on Skeleton3D...")
		# Let's inspect bone indices for legs:
		# Front legs: 8 (L) and 13 (R)
		# Hind legs: 48, 49 (L) and 53, 54 (R)
		# Wings: 18, 19, 20 (L) and 24, 25, 26 (R)
		for b in [8, 9, 13, 14, 48, 49, 53, 54, 18, 19, 24, 25]:
			print("Bone %d: %s, rest rot: %s" % [b, skel.get_bone_name(b), skel.get_bone_rest(b).basis.get_euler()])
	quit()
