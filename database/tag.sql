create table tag
(
    id         bigint default nextval('tag_id_seq'::regclass) not null
        primary key,
    name       varchar(255)                                   not null,
    parent_tag bigint
        constraint tag_inheritance
            references tag
            on update set null on delete set null,
    project_id bigint                                         not null
        constraint tag_project
            references project
            on update cascade on delete cascade
);

alter table tag
    owner to postgres;

create index tag_index_2
    on tag (parent_tag);

create index tag_project
    on tag (project_id);

