create database Spacex
go
use Spacex 
go
create table Users (
Id int primary key not null,
Imie varchar(30) not null check(len(Imie) > 3),
Nazwisko varchar(30) not null check(len(Nazwisko) > 3),
DataDodania date not null,
RodzajUser varchar(20) not null check(RodzajUser in ('Astronauta','Admin'),
Specjalizacja varchar(30) check(len(Specjalizacja) > 3),
Ulica varchar(30) not null check(len(Ulica) > 3),            -- ulica + numer domu
Miasto varchar(30) not null check(len(Miasto) > 3),
KodPocztowy char(5) not null check(len(KodPocztowy) = 5))     -- bez - w kodzie

create table Misja (
Id int primary key not null,
Nazwa varchar(30) not null,
Opis varchar(max),
Statusy varchar(10) not null check(Statusy in ('Zakonczona','W Trakcie','Nie Rozpoczeta'),
DataRozpoczecia datetime not null,
DataZakonczenia datetime not null)

