USE master
GO

DROP DATABASE IF EXISTS magazyn2022
GO

CREATE DATABASE magazyn2022
GO

USE magazyn2022
GO

IF NOT EXISTS (SELECT name  
     FROM master.sys.server_principals
     WHERE name = 'app')
BEGIN
    CREATE LOGIN app WITH PASSWORD = 'app', CHECK_POLICY = OFF
END
GO

CREATE USER app FOR LOGIN app
GO

EXEC sp_addrolemember 'db_datawriter', 'app'
EXEC sp_addrolemember 'db_datareader', 'app'

CREATE TABLE Uzytkownicy (
    Login VARCHAR(50) PRIMARY KEY,
    Haslo VARCHAR(50) NOT NULL CHECK(LEN(Haslo) >= 4)
)

INSERT INTO Uzytkownicy VALUES
('admin', 'admin123')

CREATE TABLE Produkty (
    Id INT PRIMARY KEY IDENTITY,
    Nazwa VARCHAR(50) NOT NULL,
    Kategoria VARCHAR(50) NOT NULL CHECK (Kategoria IN ('Sport', 'Zabawki', 'Ubrania')),
    Ilosc SMALLINT NOT NULL CHECK (Ilosc > 0),
    Cena MONEY NOT NULL CHECK (Cena > 0)
)

SET IDENTITY_INSERT Produkty ON

INSERT INTO Produkty (Id, Nazwa, Kategoria, Ilosc, Cena) VALUES
(1, 'Rower', 'Sport', 10, 1000),
(2, 'Pluszowy miś', 'Zabawki', 40, 50),
(3, 'Koń na biegunach', 'Zabawki', 2, 200),
(4, 'Spodnie', 'Ubrania', 16, 99.99),
(5, 'Sandały', 'Ubrania', 21, 78.55),
(6, 'Rakieta tenisowa', 'Sport', 3, 250)

SET IDENTITY_INSERT Produkty OFF