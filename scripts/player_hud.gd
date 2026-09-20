extends Control

@export var player_dragon: Node

@onready var health_bar = $MarginContainer/VBoxContainer/HealthBar
@onready var stamina_bar = $MarginContainer/VBoxContainer/StaminaBar
@onready var lives_label = $MarginContainer/VBoxContainer/TopRow/LivesLabel
@onready var stage_label = $MarginContainer/VBoxContainer/TopRow/StageLabel
@onready var xp_bar = $MarginContainer/VBoxContainer/XPBar
@onready var flight_state_label = $MarginContainer/VBoxContainer/FlightStateLabel

@onready var element_label = $BottomRight/ElementPanel/ElementLabel
@onready var element_icons_label = $BottomRight/ElementPanel/IconsLabel
@onready var ultimate_bar = $BottomRight/UltimateBar
@onready var speed_alt_label = $BottomLeft/SpeedAltLabel

const ELEMENT_NAMES = {
	"fire": "FUEGO 🔥",
	"ice": "HIELO ❄️",
	"water": "AGUA 💧",
	"plants": "PLANTA 🌿",
	"air": "AIRE 💨"
}

func _process(_delta):
	if not player_dragon: return

	# Vidas (❤️❤️❤️)
	var lives_count = player_dragon.lives if "lives" in player_dragon else 3
	var hearts_str = ""
	for i in range(lives_count):
		hearts_str += "❤️ "
	for i in range(3 - lives_count):
		hearts_str += "🖤 "
	if lives_label: lives_label.text = hearts_str

	# Salud y Estamina
	if health_bar: health_bar.value = player_dragon.health
	if stamina_bar: stamina_bar.value = player_dragon.stamina

	# Etapa y XP
	var stage_name = "BEBÉ DRAGÓN (NIVEL 1)"
	var next_xp = 400
	if player_dragon.stage == 2:
		stage_name = "DRAGÓN JOVEN (NIVEL 2)"
		next_xp = 1200
	elif player_dragon.stage >= 3:
		stage_name = "REY TITÁN ANCESTRAL (NIVEL 3)"
		next_xp = 2500
	if stage_label: stage_label.text = stage_name
	
	if xp_bar:
		xp_bar.max_value = next_xp
		xp_bar.value = player_dragon.points

	# Estado de Vuelo / Tierra
	if flight_state_label:
		if "state" in player_dragon and player_dragon.state == 2: # LANDED
			flight_state_label.text = "POSADO EN TIERRA - [ESPACIO / R1] PARA DESPEGAR"
			flight_state_label.modulate = Color(0.4, 1.0, 0.4)
		else:
			flight_state_label.text = "EN VUELO AERODINÁMICO - PATAS RECOGIDAS"
			flight_state_label.modulate = Color(0.6, 0.8, 1.0)

	# Elementos
	var elem = player_dragon.current_element
	if element_label:
		element_label.text = ELEMENT_NAMES.get(elem, elem.to_upper())
	if ultimate_bar:
		ultimate_bar.value = player_dragon.ultimate_charge

	# Velocidad y Altura
	if speed_alt_label:
		var spd = int(player_dragon.current_speed if "current_speed" in player_dragon else 0)
		var alt = int(player_dragon.global_position.y)
		speed_alt_label.text = "VEL: %d km/h  |  ALT: %d m" % [spd, alt]
