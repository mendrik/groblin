create table node
(
    id      bigint  default nextval('node_id_seq'::regclass) not null
        primary key,
    name    varchar(255)                                     not null,
    node_id bigint
        references node
            on update restrict on delete cascade,
    type    varchar(255)                                     not null,
    "order" integer default 0                                not null
);

alter table node
    owner to postgres;

INSERT INTO public.node (id, name, node_id, type, "order") VALUES (139, 'St. Konrad', 122, 'Object', 0);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (122, 'Ravensburg', 121, 'Object', 1);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (126, 'Frankfurt', 121, 'Object', 3);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (144, 'Node', 121, 'Object', 0);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (140, 'Albert Einstein', 122, 'Object', 1);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (127, 'Helsinki', 120, 'Object', 0);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (128, 'Tampere', 120, 'Object', 1);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (129, 'Oulu', 120, 'Object', 2);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (141, 'Spohn Gymnasium', 122, 'Object', 2);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (148, 'Type tester', 1, 'Object', 2);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (149, 'String', 148, 'String', 0);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (150, 'Number', 148, 'Number', 1);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (120, 'Finland', 1, 'Object', 0);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (151, 'Boolean', 148, 'Boolean', 2);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (152, 'Date', 148, 'Date', 3);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (154, 'List', 148, 'List', 4);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (121, 'Germany', 1, 'Object', 1);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (124, 'Stuttgart', 121, 'Object', 2);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (1, 'root', null, 'object', 7);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (158, 'Address', 148, 'Schema', 5);
INSERT INTO public.node (id, name, node_id, type, "order") VALUES (180, 'New node', 148, 'Object', 6);
