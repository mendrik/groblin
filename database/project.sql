create table project
(
    id   bigint default nextval('project_id_seq'::regclass) not null
        primary key,
    name varchar(255)                                       not null
);

alter table project
    owner to postgres;

