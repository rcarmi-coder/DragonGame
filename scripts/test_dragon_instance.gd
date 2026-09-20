extends SceneTree

func _init():
	var scene = load("res://models/sculpted_dragon.glb")
	if scene:
		var inst = scene.instantiate()
		print("Instanciado exitosamente: ", inst.name)
		
		# Buscar AnimationPlayer
		var anim = find_anim_player(inst)
		if anim:
			print("AnimPlayer encontrado!")
			for a in anim.get_animation_list():
				var anim_res = anim.get_animation(a)
				print("  Anim: ", a, " | duracion: ", anim_res.length, "s | loop: ", anim_res.loop_mode)
		
		# Medir AABB de los meshes
		var aabb = calculate_aabb(inst)
		print("AABB del dragon: ", aabb)
		print("Tamanio: ", aabb.size)
	quit()

func calculate_aabb(node: Node) -> AABB:
	var total_aabb = AABB()
	var first = true
	for child in node.get_children():
		if child is VisualInstance3D:
			var child_aabb = child.get_aabb()
			if first:
				total_aabb = child_aabb
				first = false
			else:
				total_aabb = total_aabb.merge(child_aabb)
		var sub_aabb = calculate_aabb(child)
		if sub_aabb.size != Vector3.ZERO:
			if first:
				total_aabb = sub_aabb
				first = false
			else:
				total_aabb = total_aabb.merge(sub_aabb)
	return total_aabb

func find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer: return node
	for c in node.get_children():
		var f = find_anim_player(c)
		if f: return f
	return null
