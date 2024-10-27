create table project_user
(
    user_id    bigint       not null
        constraint project_user_relation_3
            references "user" ()
            on update cascade on delete cascade,
    project_id bigint       not null
        constraint project_user_relation_2
            references project
            on update cascade on delete cascade,
    role       varchar(255) not null,
    primary key (user_id, project_id)
);

alter table project_user
    owner to postgres;

