extends SceneTree

func _init():
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file("res://models/sculpted_dragon.glb", state)
	if err == OK:
		var inst = gltf.generate_scene(state)
		var anim_player: AnimationPlayer = null
		for c in inst.find_children("*", "AnimationPlayer", true):
			anim_player = c
			break
		if anim_player:
			var anim = anim_player.get_animation("Armature|Armature|mo_0077_anim_0001|Base Layer")
			print("Total tracks in flight anim: ", anim.get_track_count())
			for t in range(anim.get_track_count()):
				var path = String(anim.track_get_path(t))
				var bone_name = path.get_slice(":", 1)
				print("Track %d -> %s" % [t, bone_name])
	quit()
