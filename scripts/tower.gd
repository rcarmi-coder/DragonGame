extends StaticBody3D

var health: float = 200.0
var is_collapsed: bool = false

@onready var crenellations_node = $Crenellations

func _ready():
	generate_crenellations()

func generate_crenellations():
	if not crenellations_node: return
	var stone_mat = $Shaft.mesh.material
	var count = 8
	var radius = 5.2
	for i in range(count):
		var angle = (float(i) / float(count)) * TAU
		var merlon = MeshInstance3D.new()
		var box = BoxMesh.new()
		box.size = Vector3(1.6, 1.8, 0.8)
		box.material = stone_mat
		merlon.mesh = box
		merlon.position = Vector3(sin(angle) * radius, 0.0, cos(angle) * radius)
		merlon.rotation.y = angle
		crenellations_node.add_child(merlon)

func take_damage(amount: float):
	if is_collapsed: return
	health -= amount
	if health <= 0.0:
		collapse()

func collapse():
	is_collapsed = true
	var tween = create_tween()
	tween.tween_property(self, "rotation_degrees:z", 70.0, 1.8).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.parallel().tween_property(self, "position:y", position.y - 12.0, 1.8)
