extends SceneTree

func _init():
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file("res://models/sculpted_dragon.glb", state)
	if err == OK:
		var inst = gltf.generate_scene(state)
		var skel: Skeleton3D = null
		for c in inst.find_children("*", "Skeleton3D", true):
			skel = c
			break
		if skel:
			print("--- BONE REST POSITIONS ---")
			for i in range(skel.get_bone_count()):
				var rest = skel.get_bone_rest(i)
				var global_rest = skel.get_bone_global_rest(i)
				print("Bone %d: %-15s | Pos: (%.2f, %.2f, %.2f) | Parent: %s" % [
					i, skel.get_bone_name(i),
					global_rest.origin.x, global_rest.origin.y, global_rest.origin.z,
					skel.get_bone_parent(i)
				])
	quit()
