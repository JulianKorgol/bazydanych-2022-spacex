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
                            numerMieszkania SMALLINT CHECK(numerMieszkania > 0),
                            miasto VARCHAR(50) NOT NULL,
                            kodPocztowy CHAR(6) NOT NULL CHECK(kodPocztowy LIKE '%-%'),
                            rodzajUzytkownika VARCHAR(30) NOT NULL CHECK(rodzajUzytkownika IN ('headadmin', 'admin', 'user')),
                            specjalizacja VARCHAR(70),
                            SzefId INT REFERENCES Uzytkownik(id)
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
                       status VARCHAR(30) NOT NULL CHECK(status IN ('planowana', 'trwa', 'zakończona')),
                       terminRozpoczecia DATETIME NOT NULL CHECK(terminRozpoczecia > GETDATE()),
                       terminZakonczenia DATETIME NOT NULL CHECK(terminZakonczenia > GETDATE()),
                       wzorzecId INT REFERENCES WzorceMisji(id),
                       CONSTRAINT con_daty CHECK(terminRozpoczecia < terminZakonczenia)
)

CREATE TABLE Zaloga (
                        id INT NOT NULL IDENTITY PRIMARY KEY,
                        idUzytkownik INT NOT NULL REFERENCES Uzytkownik(id),
                        idMisja INT NOT NULL REFERENCES Misja(id)
)
