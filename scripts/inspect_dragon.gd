extends SceneTree

func _init():
	print("--- INSPECCIONANDO SCULPTED_DRAGON.GLB ---")
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file("res://models/sculpted_dragon.glb", state)
	if err == OK:
		var inst = gltf.generate_scene(state)
		print("Modelo GLTF generado exitosamente: ", inst.name)
		print_hierarchy(inst, "  ")
		var anim_player = find_anim_player(inst)
		if anim_player:
			print("ANIMACIONES DISPONIBLES:")
			for anim_name in anim_player.get_animation_list():
				print("  - ", anim_name)
		else:
			print("No se encontró AnimationPlayer.")
	else:
		print("Error en append_from_file: ", err)
	quit()

func print_hierarchy(node: Node, indent: String):
	print(indent + node.name + " (" + node.get_class() + ")")
	for child in node.get_children():
		print_hierarchy(child, indent + "  ")

func find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var found = find_anim_player(child)
		if found: return found
	return null
