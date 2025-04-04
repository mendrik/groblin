--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.1 (Ubuntu 17.1-1.pgdg24.10+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public."user" VALUES ('QeiAcrhP7bfxifFomjBqDh0paCjGLLjh', 'Andreas Herd', 'mendrik76@gmail.com', false, NULL, '2025-03-07 14:45:33.219', '2025-03-07 14:45:33.219');


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public.account VALUES ('t18c9hIxNqDK9VstgeELZGtjwWWKN8DJ', 'QeiAcrhP7bfxifFomjBqDh0paCjGLLjh', 'credential', 'QeiAcrhP7bfxifFomjBqDh0paCjGLLjh', NULL, NULL, NULL, NULL, NULL, NULL, '7246f68e8bd7abbc28c68622294f897e:18657934e5663a21d309f7ebaaccc9221f79c84f32b33284d1bc33732932c78ebbf484c550ff94ff336279963f28f93499268b334a58275872727450c5b4f279', '2025-03-07 14:45:33.37', '2025-03-07 14:45:33.37');


--
-- Data for Name: project; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public.project VALUES (1, 'My Project');


--
-- Data for Name: api_key; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public.api_key VALUES (11, 1, '2e3915aaae8e79e0981ac330ac177c81c1d0be89ed79646965753035e90fcc8b', 'Public', '2025-03-07 12:48:28.443+00', NULL, true, '2025-03-07 12:48:28.44471');


--
-- Data for Name: history; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public.history VALUES ('QeiAcrhP7bfxifFomjBqDh0paCjGLLjh', 1);


--
-- Data for Name: node; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public.node VALUES (668, 'Root', 'Root', 0, NULL, 1, 1);
INSERT INTO public.node VALUES (671, 'Environment', 'List', 0, 668, 1, 2);
INSERT INTO public.node VALUES (672, 'url', 'String', 0, 671, 1, 3);
INSERT INTO public.node VALUES (674, 'image', 'Media', 1, 671, 1, 3);
INSERT INTO public.node VALUES (675, 'color', 'Color', 2, 671, 1, 3);
INSERT INTO public.node VALUES (676, 'article', 'Article', 3, 671, 1, 3);
INSERT INTO public.node VALUES (687, 'Addresses', 'List', 1, 668, 1, 2);
INSERT INTO public.node VALUES (689, 'Street', 'String', 0, 687, 1, 3);
INSERT INTO public.node VALUES (690, 'City', 'String', 1, 687, 1, 3);
INSERT INTO public.node VALUES (691, 'Zipcode', 'String', 2, 687, 1, 3);
INSERT INTO public.node VALUES (692, 'Country', 'String', 3, 687, 1, 3);
INSERT INTO public.node VALUES (693, 'Phones', 'Object', 4, 687, 1, 3);
INSERT INTO public.node VALUES (694, 'Home', 'String', 0, 693, 1, 4);
INSERT INTO public.node VALUES (695, 'Mobile', 'String', 1, 693, 1, 4);
INSERT INTO public.node VALUES (697, 'People', 'List', 2, 668, 1, 2);
INSERT INTO public.node VALUES (698, 'Name', 'String', 0, 697, 1, 3);
INSERT INTO public.node VALUES (699, 'Age', 'Number', 1, 697, 1, 3);
INSERT INTO public.node VALUES (700, 'Birthdate', 'Date', 2, 697, 1, 3);
INSERT INTO public.node VALUES (701, 'Clothing', 'Color', 3, 697, 1, 3);
INSERT INTO public.node VALUES (702, 'Gender', 'Choice', 4, 697, 1, 3);
INSERT INTO public.node VALUES (703, 'Management', 'Boolean', 5, 697, 1, 3);


--
-- Data for Name: node_settings; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public.node_settings VALUES (196, 671, '{"scoped": true}', 1, false, false);
INSERT INTO public.node_settings VALUES (197, 674, '{"required": false, "thumbnails": ["600"], "hideColumnHead": false}', 1, false, false);
INSERT INTO public.node_settings VALUES (201, 687, '{"scoped": true}', 1, false, false);
INSERT INTO public.node_settings VALUES (203, 697, '{"scoped": true}', 1, false, false);
INSERT INTO public.node_settings VALUES (204, 702, '{"choices": ["Male", "Female"], "required": false, "hideColumnHead": false}', 1, false, false);


--
-- Data for Name: project_user; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public.project_user VALUES (1, '{Admin}', false, false, 'QeiAcrhP7bfxifFomjBqDh0paCjGLLjh');


--
-- Data for Name: values; Type: TABLE DATA; Schema: public; Owner: groblin
--

INSERT INTO public."values" VALUES (5527, 671, '{"name": "Development"}', 1, 1, NULL, NULL, '2025-03-07 12:47:05.806425');
INSERT INTO public."values" VALUES (5528, 671, '{"name": "Staging"}', 1, 2, NULL, NULL, '2025-03-07 12:47:09.703828');
INSERT INTO public."values" VALUES (5529, 671, '{"name": "Production"}', 1, 3, NULL, NULL, '2025-03-07 12:47:12.972214');
INSERT INTO public."values" VALUES (5531, 672, '{"content": "http://staging.groblin.org"}', 1, 0, '{5528}', NULL, '2025-03-07 12:47:46.961683');
INSERT INTO public."values" VALUES (5532, 672, '{"content": "http://www.groblin.org"}', 1, 0, '{5529}', NULL, '2025-03-07 12:47:53.718777');
INSERT INTO public."values" VALUES (5530, 672, '{"content": "http://localhost: 5173"}', 1, 0, '{5527}', NULL, '2025-03-07 12:48:06.795609');
INSERT INTO public."values" VALUES (5534, 674, '{"file": "project_1/fa1f02cb-472a-4d1c-be41-92b048651365", "name": "IMG_20230618_200220.webp", "size": 2736648, "contentType": "image/webp"}', 1, 0, '{5527}', NULL, '2025-03-07 12:50:27.291315');
INSERT INTO public."values" VALUES (5535, 674, '{"file": "project_1/0de251a0-1569-49b8-994d-89782947d43b", "name": "IMG_20230618_145629.webp", "size": 2228882, "contentType": "image/webp"}', 1, 0, '{5528}', NULL, '2025-03-07 12:50:57.995682');
INSERT INTO public."values" VALUES (5536, 674, '{"file": "project_1/576e2e15-2571-4ea6-8a92-93c6532eebfd", "name": "IMG_20230625_203715.webp", "size": 2556424, "contentType": "image/webp"}', 1, 0, '{5529}', NULL, '2025-03-07 12:51:06.159612');
INSERT INTO public."values" VALUES (5537, 675, '{"rgba": [180, 35, 35, 1]}', 1, 0, '{5529}', NULL, '2025-03-07 12:51:10.08471');
INSERT INTO public."values" VALUES (5538, 676, '{"content": "<h1>Hallo Otto</h1><p>This a small <strong>blog</strong> post about your life.</p><p></p><table style=\"min-width: 75px\"><colgroup><col style=\"min-width: 25px\"><col style=\"min-width: 25px\"><col style=\"min-width: 25px\"></colgroup><tbody><tr><th colspan=\"1\" rowspan=\"1\"><p>A</p></th><th colspan=\"1\" rowspan=\"1\"><p>b</p></th><th colspan=\"1\" rowspan=\"1\"><p>c</p></th></tr><tr><td colspan=\"1\" rowspan=\"1\"><p></p></td><td colspan=\"1\" rowspan=\"1\"><p></p></td><td colspan=\"1\" rowspan=\"1\"><p></p></td></tr><tr><td colspan=\"1\" rowspan=\"1\"><p></p></td><td colspan=\"1\" rowspan=\"1\"><p></p></td><td colspan=\"1\" rowspan=\"1\"><p></p></td></tr></tbody></table>"}', 1, 0, '{5527}', NULL, '2025-03-07 13:01:22.076762');
INSERT INTO public."values" VALUES (5533, 675, '{"rgba": [158, 99, 159, 1]}', 1, 0, '{5527}', NULL, '2025-03-07 13:01:55.095825');
INSERT INTO public."values" VALUES (5553, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5555, 689, '{"content": "Baker Street 221B"}', 1, 0, '{5553}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5556, 690, '{"content": "London"}', 1, 0, '{5553}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5557, 691, '{"content": "NW1 6XE"}', 1, 0, '{5553}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5558, 692, '{"content": "United Kingdom"}', 1, 0, '{5553}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5559, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5561, 689, '{"content": "Evergreen Terrace 742"}', 1, 0, '{5559}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5562, 690, '{"content": "Springfield"}', 1, 0, '{5559}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5563, 691, '{"content": "62704"}', 1, 0, '{5559}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5564, 692, '{"content": "United States"}', 1, 0, '{5559}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5565, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5567, 689, '{"content": "Roppongi 4-2-8"}', 1, 0, '{5565}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5568, 690, '{"content": "Tokyo"}', 1, 0, '{5565}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5569, 691, '{"content": "106-0032"}', 1, 0, '{5565}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5570, 692, '{"content": "Japan"}', 1, 0, '{5565}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5571, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5573, 689, '{"content": "Rue de Rivoli 10"}', 1, 0, '{5571}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5574, 690, '{"content": "Paris"}', 1, 0, '{5571}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5575, 691, '{"content": "75001"}', 1, 0, '{5571}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5576, 692, '{"content": "France"}', 1, 0, '{5571}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5577, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5579, 689, '{"content": "Calle de Alcalá 12"}', 1, 0, '{5577}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5580, 690, '{"content": "Madrid"}', 1, 0, '{5577}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5581, 691, '{"content": "28009"}', 1, 0, '{5577}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5582, 692, '{"content": "Spain"}', 1, 0, '{5577}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5583, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5585, 689, '{"content": "Queen Street 25"}', 1, 0, '{5583}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5586, 690, '{"content": "Auckland"}', 1, 0, '{5583}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5587, 691, '{"content": "1010"}', 1, 0, '{5583}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5588, 692, '{"content": "New Zealand"}', 1, 0, '{5583}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5589, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5591, 689, '{"content": "Königstraße 56"}', 1, 0, '{5589}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5593, 691, '{"content": "10115"}', 1, 0, '{5589}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5594, 692, '{"content": "Germany"}', 1, 0, '{5589}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5595, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5597, 689, '{"content": "Queen''s Road 1"}', 1, 0, '{5595}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5598, 690, '{"content": "Hong Kong"}', 1, 0, '{5595}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5599, 691, '{"content": "999077"}', 1, 0, '{5595}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5600, 692, '{"content": "China"}', 1, 0, '{5595}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5601, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5603, 689, '{"content": "Bondi Road 49"}', 1, 0, '{5601}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5604, 690, '{"content": "Sydney"}', 1, 0, '{5601}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5605, 691, '{"content": "2026"}', 1, 0, '{5601}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5606, 692, '{"content": "Australia"}', 1, 0, '{5601}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5607, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5609, 689, '{"content": "Avenida Paulista 7"}', 1, 0, '{5607}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5610, 690, '{"content": "São Paulo"}', 1, 0, '{5607}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5611, 691, '{"content": "01310-000"}', 1, 0, '{5607}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5612, 692, '{"content": "Brazil"}', 1, 0, '{5607}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5613, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5615, 689, '{"content": "Rue Saint-Honoré 50"}', 1, 0, '{5613}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5616, 690, '{"content": "Paris"}', 1, 0, '{5613}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5617, 691, '{"content": "75001"}', 1, 0, '{5613}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5618, 692, '{"content": "France"}', 1, 0, '{5613}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5619, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5621, 689, '{"content": "South Grand Avenue 95"}', 1, 0, '{5619}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5622, 690, '{"content": "Los Angeles"}', 1, 0, '{5619}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5623, 691, '{"content": "90012"}', 1, 0, '{5619}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5624, 692, '{"content": "United States"}', 1, 0, '{5619}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5625, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5627, 689, '{"content": "Via Veneto 100"}', 1, 0, '{5625}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5628, 690, '{"content": "Rome"}', 1, 0, '{5625}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5629, 691, '{"content": "00187"}', 1, 0, '{5625}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5630, 692, '{"content": "Italy"}', 1, 0, '{5625}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5631, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5633, 689, '{"content": "Rue des Francs-Bourgeois 24"}', 1, 0, '{5631}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5634, 690, '{"content": "Paris"}', 1, 0, '{5631}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5635, 691, '{"content": "75003"}', 1, 0, '{5631}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5592, 690, '{"content": "Düsseldorf"}', 1, 0, '{5589}', NULL, '2025-03-21 07:02:14.680859');
INSERT INTO public."values" VALUES (5636, 692, '{"content": "France"}', 1, 0, '{5631}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5637, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5639, 689, '{"content": "Downing Street 10"}', 1, 0, '{5637}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5640, 690, '{"content": "London"}', 1, 0, '{5637}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5641, 691, '{"content": "SW1A 2AA"}', 1, 0, '{5637}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5642, 692, '{"content": "United Kingdom"}', 1, 0, '{5637}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5643, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5645, 689, '{"content": "Central Avenue 302"}', 1, 0, '{5643}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5646, 690, '{"content": "Copenhagen"}', 1, 0, '{5643}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5647, 691, '{"content": "1051"}', 1, 0, '{5643}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5648, 692, '{"content": "Denmark"}', 1, 0, '{5643}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5649, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5651, 689, '{"content": "Pitt Street 12"}', 1, 0, '{5649}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5652, 690, '{"content": "Sydney"}', 1, 0, '{5649}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5653, 691, '{"content": "2000"}', 1, 0, '{5649}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5654, 692, '{"content": "Australia"}', 1, 0, '{5649}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5655, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5657, 689, '{"content": "Boulevard de la République 5"}', 1, 0, '{5655}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5658, 690, '{"content": "Lyon"}', 1, 0, '{5655}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5659, 691, '{"content": "69002"}', 1, 0, '{5655}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5660, 692, '{"content": "France"}', 1, 0, '{5655}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5661, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5663, 689, '{"content": "Alexanderplatz 9"}', 1, 0, '{5661}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5664, 690, '{"content": "Berlin"}', 1, 0, '{5661}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5665, 691, '{"content": "10178"}', 1, 0, '{5661}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5666, 692, '{"content": "Germany"}', 1, 0, '{5661}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5667, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5669, 689, '{"content": "Rue des Rosiers 21"}', 1, 0, '{5667}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5670, 690, '{"content": "Paris"}', 1, 0, '{5667}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5671, 691, '{"content": "75004"}', 1, 0, '{5667}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5672, 692, '{"content": "France"}', 1, 0, '{5667}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5673, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5675, 689, '{"content": "Pennsylvania Avenue 1300"}', 1, 0, '{5673}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5676, 690, '{"content": "Washington"}', 1, 0, '{5673}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5677, 691, '{"content": "20500"}', 1, 0, '{5673}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5678, 692, '{"content": "United States"}', 1, 0, '{5673}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5679, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5681, 689, '{"content": "Rue de la Paix 42"}', 1, 0, '{5679}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5682, 690, '{"content": "Paris"}', 1, 0, '{5679}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5683, 691, '{"content": "75002"}', 1, 0, '{5679}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5684, 692, '{"content": "France"}', 1, 0, '{5679}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5685, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5687, 689, '{"content": "Orchard Road 38"}', 1, 0, '{5685}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5688, 690, '{"content": "Singapore"}', 1, 0, '{5685}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5689, 691, '{"content": "238839"}', 1, 0, '{5685}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5690, 692, '{"content": "Singapore"}', 1, 0, '{5685}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5691, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5693, 689, '{"content": "Broadway Street 1770"}', 1, 0, '{5691}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5694, 690, '{"content": "New York"}', 1, 0, '{5691}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5695, 691, '{"content": "10019"}', 1, 0, '{5691}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5696, 692, '{"content": "United States"}', 1, 0, '{5691}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5697, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5699, 689, '{"content": "Rua de São Bento 10"}', 1, 0, '{5697}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5700, 690, '{"content": "Lisbon"}', 1, 0, '{5697}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5701, 691, '{"content": "1200-013"}', 1, 0, '{5697}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5702, 692, '{"content": "Portugal"}', 1, 0, '{5697}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5703, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5705, 689, '{"content": "Green Street 27"}', 1, 0, '{5703}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5706, 690, '{"content": "San Francisco"}', 1, 0, '{5703}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5707, 691, '{"content": "94108"}', 1, 0, '{5703}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5708, 692, '{"content": "United States"}', 1, 0, '{5703}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5709, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5711, 689, '{"content": "Victoria Street 8"}', 1, 0, '{5709}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5712, 690, '{"content": "London"}', 1, 0, '{5709}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5713, 691, '{"content": "SW1H 0RF"}', 1, 0, '{5709}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5714, 692, '{"content": "United Kingdom"}', 1, 0, '{5709}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5715, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5717, 689, '{"content": "Yonge Street 110"}', 1, 0, '{5715}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5718, 690, '{"content": "Toronto"}', 1, 0, '{5715}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5719, 691, '{"content": "M5C 1T6"}', 1, 0, '{5715}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5720, 692, '{"content": "Canada"}', 1, 0, '{5715}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5721, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5723, 689, '{"content": "Minato 4-1-5"}', 1, 0, '{5721}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5724, 690, '{"content": "Tokyo"}', 1, 0, '{5721}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5725, 691, '{"content": "105-0014"}', 1, 0, '{5721}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5726, 692, '{"content": "Japan"}', 1, 0, '{5721}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5727, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5729, 689, '{"content": "Seaford Road 77"}', 1, 0, '{5727}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5730, 690, '{"content": "Cape Town"}', 1, 0, '{5727}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5731, 691, '{"content": "8000"}', 1, 0, '{5727}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5732, 692, '{"content": "South Africa"}', 1, 0, '{5727}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5733, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5735, 689, '{"content": "Oak Street 1020"}', 1, 0, '{5733}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5736, 690, '{"content": "Denver"}', 1, 0, '{5733}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5737, 691, '{"content": "80203"}', 1, 0, '{5733}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5738, 692, '{"content": "United States"}', 1, 0, '{5733}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5739, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5741, 689, '{"content": "St. Catherine Street 500"}', 1, 0, '{5739}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5742, 690, '{"content": "Montreal"}', 1, 0, '{5739}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5743, 691, '{"content": "H3B 1A1"}', 1, 0, '{5739}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5744, 692, '{"content": "Canada"}', 1, 0, '{5739}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5745, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5747, 689, '{"content": "Rue du Faubourg Saint-Antoine 16"}', 1, 0, '{5745}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5748, 690, '{"content": "Paris"}', 1, 0, '{5745}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5749, 691, '{"content": "75011"}', 1, 0, '{5745}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5750, 692, '{"content": "France"}', 1, 0, '{5745}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5751, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5753, 689, '{"content": "King Street 25"}', 1, 0, '{5751}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5754, 690, '{"content": "Edinburgh"}', 1, 0, '{5751}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5755, 691, '{"content": "EH2 4JW"}', 1, 0, '{5751}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5756, 692, '{"content": "United Kingdom"}', 1, 0, '{5751}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5757, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5759, 689, '{"content": "Plaça de Catalunya 15"}', 1, 0, '{5757}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5760, 690, '{"content": "Barcelona"}', 1, 0, '{5757}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5761, 691, '{"content": "08002"}', 1, 0, '{5757}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5762, 692, '{"content": "Spain"}', 1, 0, '{5757}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5763, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5765, 689, '{"content": "Vereda de la Estrella 9-13"}', 1, 0, '{5763}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5766, 690, '{"content": "Madrid"}', 1, 0, '{5763}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5767, 691, '{"content": "28004"}', 1, 0, '{5763}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5768, 692, '{"content": "Spain"}', 1, 0, '{5763}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5769, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5771, 689, '{"content": "Habarzel Street 63"}', 1, 0, '{5769}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5772, 690, '{"content": "Tel Aviv"}', 1, 0, '{5769}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5773, 691, '{"content": "69710"}', 1, 0, '{5769}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5774, 692, '{"content": "Israel"}', 1, 0, '{5769}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5775, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5777, 689, '{"content": "Manhattan Avenue 5"}', 1, 0, '{5775}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5778, 690, '{"content": "New York"}', 1, 0, '{5775}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5779, 691, '{"content": "10029"}', 1, 0, '{5775}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5780, 692, '{"content": "United States"}', 1, 0, '{5775}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5781, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5783, 689, '{"content": "Holyrood Road 1"}', 1, 0, '{5781}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5784, 690, '{"content": "Edinburgh"}', 1, 0, '{5781}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5785, 691, '{"content": "EH8 8BT"}', 1, 0, '{5781}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5786, 692, '{"content": "United Kingdom"}', 1, 0, '{5781}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5787, 687, '{"name": null}', 1, 0, '{}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5789, 689, '{"content": "John Street 21"}', 1, 0, '{5787}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5790, 690, '{"content": "Dublin"}', 1, 0, '{5787}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5791, 691, '{"content": "D02 YX88"}', 1, 0, '{5787}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5792, 692, '{"content": "Ireland"}', 1, 0, '{5787}', NULL, '2025-03-10 19:55:29.623719');
INSERT INTO public."values" VALUES (5793, 694, '{"content": "0358927127"}', 1, 0, '{5553}', NULL, '2025-03-11 19:47:23.151701');
INSERT INTO public."values" VALUES (5794, 695, '{"content": "2827671299"}', 1, 0, '{5553}', NULL, '2025-03-11 19:47:27.044926');
INSERT INTO public."values" VALUES (5795, 695, '{"content": "1231321312"}', 1, 0, '{5559}', NULL, '2025-03-11 20:50:24.492645');
INSERT INTO public."values" VALUES (5796, 695, '{"content": "0345678972"}', 1, 0, '{5565}', NULL, '2025-03-11 20:50:30.062462');
INSERT INTO public."values" VALUES (5797, 694, '{"content": "345678"}', 1, 0, '{5613}', NULL, '2025-03-11 21:02:32.255792');
INSERT INTO public."values" VALUES (5798, 695, '{"content": "23456789"}', 1, 0, '{5613}', NULL, '2025-03-11 21:02:34.057039');
INSERT INTO public."values" VALUES (5799, 697, '{"name": "Andreas"}', 1, 1, NULL, NULL, '2025-03-21 11:35:26.13985');
INSERT INTO public."values" VALUES (5800, 698, '{"content": "Andreas Herd"}', 1, 0, '{5799}', NULL, '2025-03-21 11:35:30.913174');
INSERT INTO public."values" VALUES (5803, 701, '{"rgba": [165, 131, 11, 1]}', 1, 0, '{5799}', NULL, '2025-03-21 11:35:50.287954');
INSERT INTO public."values" VALUES (5804, 703, '{"state": true}', 1, 0, '{5799}', NULL, '2025-03-21 11:36:21.633353');
INSERT INTO public."values" VALUES (5806, 697, '{"name": "Mike"}', 1, 2, NULL, NULL, '2025-03-21 11:43:08.730558');
INSERT INTO public."values" VALUES (5807, 698, '{"content": "Michael C. Maurer"}', 1, 0, '{5806}', NULL, '2025-03-21 11:43:18.865301');
INSERT INTO public."values" VALUES (5810, 701, '{"rgba": [210, 5, 5, 1]}', 1, 0, '{5806}', NULL, '2025-03-21 11:43:42.329717');
INSERT INTO public."values" VALUES (5811, 702, '{"selected": "Female"}', 1, 0, '{5806}', NULL, '2025-03-21 11:43:45.0938');
INSERT INTO public."values" VALUES (5812, 697, '{"name": "Berni"}', 1, 3, NULL, NULL, '2025-03-21 11:43:50.957378');
INSERT INTO public."values" VALUES (5814, 698, '{"content": "Bernhard Münst"}', 1, 0, '{5812}', NULL, '2025-03-21 11:43:58.382079');
INSERT INTO public."values" VALUES (5816, 702, '{"selected": "Male"}', 1, 0, '{5812}', NULL, '2025-03-21 11:44:14.99109');
INSERT INTO public."values" VALUES (5817, 701, '{"rgba": [67, 147, 75, 1]}', 1, 0, '{5812}', NULL, '2025-03-21 11:44:19.139573');
INSERT INTO public."values" VALUES (5818, 703, '{"state": true}', 1, 0, '{5812}', NULL, '2025-03-21 11:44:21.089379');
INSERT INTO public."values" VALUES (5822, 700, '{"date": "1976-11-14"}', 1, 0, '{5799}', NULL, '2025-03-23 20:58:33.362776');
INSERT INTO public."values" VALUES (5823, 700, '{"date": "1976-10-10"}', 1, 0, '{5806}', NULL, '2025-03-23 20:58:44.065165');
INSERT INTO public."values" VALUES (5824, 700, '{"date": "1977-07-01"}', 1, 0, '{5812}', NULL, '2025-03-23 20:58:58.970932');
INSERT INTO public."values" VALUES (5801, 699, '{"figure": 48}', 1, 0, '{5799}', NULL, '2025-03-23 21:21:46.207904');
INSERT INTO public."values" VALUES (5808, 699, '{"figure": 49}', 1, 0, '{5806}', NULL, '2025-03-23 21:21:49.431867');
INSERT INTO public."values" VALUES (5813, 699, '{"figure": 47}', 1, 0, '{5812}', NULL, '2025-03-23 21:21:52.351167');
INSERT INTO public."values" VALUES (5805, 702, '{"selected": "Male"}', 1, 0, '{5799}', NULL, '2025-03-24 06:38:59.925462');
INSERT INTO public."values" VALUES (5825, 695, '{"content": "23456709-32"}', 1, 0, '{5577}', NULL, '2025-04-01 07:29:35.225302');
INSERT INTO public."values" VALUES (5826, 703, '{"state": false}', 1, 0, '{5806}', NULL, '2025-04-02 10:19:50.368967');


--
-- Name: api_key_id_seq; Type: SEQUENCE SET; Schema: public; Owner: groblin
--

SELECT pg_catalog.setval('public.api_key_id_seq', 11, true);


--
-- Name: node_id_seq; Type: SEQUENCE SET; Schema: public; Owner: groblin
--

SELECT pg_catalog.setval('public.node_id_seq', 703, true);


--
-- Name: node_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: groblin
--

SELECT pg_catalog.setval('public.node_settings_id_seq', 204, true);


--
-- Name: project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: groblin
--

SELECT pg_catalog.setval('public.project_id_seq', 1, true);


--
-- Name: values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: groblin
--

SELECT pg_catalog.setval('public.values_id_seq', 5826, true);


--
-- PostgreSQL database dump complete
--

