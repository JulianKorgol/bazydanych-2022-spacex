USE master
GO

DROP DATABASE IF EXISTS spacex
GO

CREATE DATABASE spacex
GO

USE spacex
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

-- Kod tworzący tabele
CREATE TABLE Uzytkownik (
                            id INT NOT NULL IDENTITY PRIMARY KEY,
                            imie VARCHAR(30) NOT NULL CHECK(LEN(imie) >= 3),
                            nazwisko VARCHAR(30) NOT NULL CHECK(LEN(nazwisko) >= 3),
                            ulica VARCHAR(50) NOT NULL,
                            numerDomu SMALLINT NOT NULL CHECK(numerDomu > 0),
                            numerMieszkania SMALLINT NOT NULL CHECK(numerMieszkania > 0), -- numer mieszkania powinien być opcjonalny
                            miasto VARCHAR(50) NOT NULL,
                            kodPocztowy CHAR(6) NOT NULL CHECK(kodPocztowy LIKE '%-%'),
                            rodzajUzytkownika VARCHAR(30) NOT NULL CHECK(rodzajUzytkownika IN ('Headadmin', 'admin', 'user')), -- skoro admin i user pisane są małymi literami, to samo powinno tyczyć się headadmin
                            specjalizacja VARCHAR(70)
                            -- brakuje pola ZwierzchnikId lub SzefId
)

CREATE TABLE WzorceMisji (
                             id INT NOT NULL IDENTITY PRIMARY KEY,
                             nazwa VARCHAR(150) NOT NULL,
                             opis VARCHAR(max),
                             liczbaCzlonkowZalogi SMALLINT NOT NULL
)

CREATE TABLE Misja (
                       id INT NOT NULL IDENTITY PRIMARY KEY,
                       nazwa VARCHAR(150) NOT NULL,
                       opis VARCHAR(max),
                       status VARCHAR(30) NOT NULL CHECK(status IN ('w trakcie przygotowań', 'trwa', 'zakończona')), -- może zamiast 'w trakcie przygotowań' lepiej użyć 'planowana'
                       terminRozpoczecia DATETIME NOT NULL CHECK(terminRozpoczecia > GETDATE()),
                       terminZakonczenia DATETIME NOT NULL CHECK(terminZakonczenia > GETDATE()),
                       wzorzecId INT REFERENCES WzorceMisji(id)
                       -- dodajcie jeszcze CONSTRAINT, który sprawdzi, czy terminRozpoczęcia < terminaZakończenia
)

CREATE TABLE Zaloga (
                        id INT NOT NULL IDENTITY PRIMARY KEY,
                        idUzytkownik INT NOT NULL REFERENCES Uzytkownik(id),
                        idMisja INT NOT NULL REFERENCES Misja(id)
)