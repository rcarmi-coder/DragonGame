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
			# Check track 4 (_j008_08 - left front leg)
			print("Track 4 key 0: ", anim.track_get_key_value(4, 0))
			print("Track 4 type: ", anim.track_get_type(4))
			# Check track 36 (_j017_049 - left hind leg)
			print("Track 36 key 0: ", anim.track_get_key_value(36, 0))
	quit()
