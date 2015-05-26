
drop table if exists request_logs;
drop table if exists td1204_gps_demo; 
drop table if exists atmel_demo;


create table if not exists request_logs(
  id serial primary key,
  date timestamp not null,
  method varchar(4),
  path varchar(50),
  data json not null
);


create table if not exists td1204_gps_demo(
  id serial primary key,
  deviceid varchar(12) not null,
  date timestamp not null,
  receivedat timestamp not null,
  snr numeric(4,2) null,
  geoloc bool,
  lat numeric(8,6) null,
  lng numeric(8,6) null,
  payload varchar(24) not null
);

create table if not exists atmel_demo(
  id serial primary key,
  deviceid varchar(12) not null,
  date timestamp not null,
  receivedat timestamp not null,
  snr numeric(4,2) null,
  temperature smallint null,
  brightness smallint null,
  payload varchar(24) not null
);