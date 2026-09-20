extends SceneTree

func _init():
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file("res://models/sculpted_dragon.glb", state)
	if err == OK:
		var inst = gltf.generate_scene(state)
		var skel = find_skeleton(inst)
		if skel:
			print("Total bones in Skeleton3D: ", skel.get_bone_count())
			for i in range(skel.get_bone_count()):
				var bname = skel.get_bone_name(i)
				var parent_idx = skel.get_bone_parent(i)
				var parent_name = skel.get_bone_name(parent_idx) if parent_idx >= 0 else "None"
				print("Bone %d: %s (Parent: %s)" % [i, bname, parent_name])
		var anim_player = find_anim_player(inst)
		if anim_player:
			for a in anim_player.get_animation_list():
				var anim = anim_player.get_animation(a)
				print("Anim: %s | Length: %.2fs | Track count: %d" % [a, anim.length, anim.get_track_count()])
	quit()

func find_skeleton(node: Node) -> Skeleton3D:
	if node is Skeleton3D: return node
	for c in node.get_children():
		var f = find_skeleton(c)
		if f: return f
	return null

func find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer: return node
	for c in node.get_children():
		var f = find_anim_player(c)
		if f: return f
	return null
