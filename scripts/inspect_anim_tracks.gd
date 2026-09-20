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
			for anim_name in anim_player.get_animation_list():
				var anim = anim_player.get_animation(anim_name)
				# Check track 0 or root track to see if it moves
				print("--- ANIM: ", anim_name, " (len: ", anim.length, ") ---")
				for t in range(min(5, anim.get_track_count())):
					print("   Track %d: %s (keys: %d)" % [t, anim.track_get_path(t), anim.track_get_key_count(t)])
	quit()
