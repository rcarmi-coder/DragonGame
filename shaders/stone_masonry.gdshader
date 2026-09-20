shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec4 stone_color_1 : source_color = vec4(0.62, 0.58, 0.50, 1.0);
uniform vec4 stone_color_2 : source_color = vec4(0.48, 0.44, 0.38, 1.0);
uniform vec4 mortar_color : source_color = vec4(0.30, 0.28, 0.25, 1.0);
uniform vec2 brick_scale = vec2(6.0, 18.0);

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void fragment() {
    vec2 uv = UV * brick_scale;
    // Filas alternadas (ladrillos trabados)
    float row = floor(uv.y);
    if (mod(row, 2.0) > 0.5) {
        uv.x += 0.5;
    }
    
    vec2 tile = fract(uv);
    vec2 tile_id = floor(uv);
    
    // Líneas de mortero
    float mortar_x = smoothstep(0.0, 0.08, tile.x) * smoothstep(1.0, 0.92, tile.x);
    float mortar_y = smoothstep(0.0, 0.08, tile.y) * smoothstep(1.0, 0.92, tile.y);
    float is_brick = mortar_x * mortar_y;
    
    // Variación de color entre sillares de piedra
    float rnd = hash(tile_id);
    vec3 brick_col = mix(stone_color_1.rgb, stone_color_2.rgb, rnd);
    
    // Suciedad / envejecimiento vertical
    float grime = hash(tile_id * 1.7) * 0.15;
    brick_col -= vec3(grime);

    ALBEDO = mix(mortar_color.rgb, brick_col, is_brick);
    ROUGHNESS = mix(0.95, 0.85, is_brick);
    SPECULAR = 0.2;
}
