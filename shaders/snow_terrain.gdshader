shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec4 snow_color : source_color = vec4(0.95, 0.97, 1.0, 1.0);
uniform vec4 rock_color : source_color = vec4(0.24, 0.23, 0.22, 1.0);
uniform vec4 grass_color : source_color = vec4(0.19, 0.38, 0.15, 1.0);
uniform vec4 dark_soil_color : source_color = vec4(0.14, 0.12, 0.10, 1.0);
uniform float snow_height_threshold = 150.0;
uniform float snow_slope_threshold = 0.55;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void fragment() {
    float height = (INV_VIEW_MATRIX * vec4(VERTEX, 1.0)).y;
    vec3 world_pos = (INV_VIEW_MATRIX * vec4(VERTEX, 1.0)).xyz;
    float slope = 1.0 - max(0.0, dot(NORMAL, vec3(0.0, 1.0, 0.0)));

    // Micro-detalles del terreno
    float detail_noise = noise(world_pos.xz * 0.08) * 0.4 + noise(world_pos.xz * 0.25) * 0.2;

    // Mezcla de hierba verde y tierra en valles
    vec3 meadow = mix(grass_color.rgb, dark_soil_color.rgb, smoothstep(0.3, 0.7, detail_noise));
    
    // Rocas escarpadas en pendientes (como en Foto 4)
    vec3 rock = mix(rock_color.rgb, dark_soil_color.rgb, detail_noise);
    vec3 base_terrain = mix(meadow, rock, smoothstep(0.18, 0.48, slope));

    // Nieve en altas cumbres y crestas alpinas (como en Foto 5)
    float snow_altitude_factor = smoothstep(snow_height_threshold - 30.0, snow_height_threshold + 40.0, height + (detail_noise - 0.5) * 20.0);
    // En paredes casi verticales la nieve resbala
    float snow_adhesion = 1.0 - smoothstep(snow_slope_threshold - 0.15, snow_slope_threshold + 0.15, slope);
    float snow_blend = clamp(snow_altitude_factor * snow_adhesion, 0.0, 1.0);

    // Destellos especulares de hielo bajo el sol alpino
    vec2 sparkle_uv = floor(world_pos.xz * 4.0);
    float sparkle_rnd = hash(sparkle_uv);
    float spec_highlight = pow(max(0.0, dot(NORMAL, VIEW)), 32.0);
    float sparkle = step(0.93, sparkle_rnd) * spec_highlight * 2.5;

    vec3 final_snow = snow_color.rgb + vec3(sparkle * 0.8, sparkle * 0.9, sparkle * 1.0);

    ALBEDO = mix(base_terrain, final_snow, snow_blend);
    ROUGHNESS = mix(mix(0.85, 0.92, slope), 0.35, snow_blend);
    SPECULAR = mix(0.15, 0.85, snow_blend);
}
