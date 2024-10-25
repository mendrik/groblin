create table "user"
(
    email    varchar(255) not null,
    password varchar(255) not null,
    id       bigserial
);

alter table "user"
    owner to postgres;

create unique index user_index_1
    on "user" (id);

