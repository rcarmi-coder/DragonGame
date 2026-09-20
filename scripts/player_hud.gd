extends Control

@export var player_dragon: Node

@onready var health_bar = $MarginContainer/VBoxContainer/HealthBar
@onready var stamina_bar = $MarginContainer/VBoxContainer/StaminaBar
@onready var stage_label = $MarginContainer/VBoxContainer/StageLabel
@onready var points_label = $MarginContainer/VBoxContainer/PointsLabel
@onready var element_label = $BottomRight/ElementPanel/ElementLabel
@onready var ultimate_bar = $BottomRight/UltimateBar

func _process(_delta):
	if not player_dragon: return

	health_bar.value = player_dragon.health
	stamina_bar.value = player_dragon.stamina
	points_label.text = "ORBES: " + str(player_dragon.points)
	
	var stage_name = "CRÍA FEROZ"
	if player_dragon.stage == 2: stage_name = "DRAGÓN JOVEN"
	elif player_dragon.stage >= 3: stage_name = "ANCIANO COLOSAL"
	stage_label.text = "ETAPA: " + stage_name

	element_label.text = player_dragon.current_element.to_upper()
	ultimate_bar.value = player_dragon.ultimate_charge
