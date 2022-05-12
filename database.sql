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
                            SzefId INT REFERENCES Uzytkownik(id),
                            haslo VARCHAR(75) NOT NULL CHECK(LEN(haslo) > 10),
                            login VARCHAR(75) NOT NULL CHECK(LEN(login) > 3)
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
INSERT INTO Misja VALUES 
(1, 'Pierwsza Misja','trwa','2022-05-13','2022-05-14',null),
(2, 'Druga Misja','planowana','2022-05-14','2022-05-15',null),
(3, 'Trzecia Misja Misja','zako�czona','2022-05-16','2022-05-17',null)



INSERT INTO WzorceMisji VALUES 
('Pierwszy Wzorzec Misji','To jest pierwszy wzorzec misji',5),
('Druga Wzorzec Misji','To jest drugi wzorzec misji',6),
('Trzecia Wzorzec Misji','To jest trzeci wzorzec misji',2),
('Czwarta Wzorzec Misji','To jest czwarty wzorzec misji',3)


INSERT INTO Uzytkownik VALUES
('Mateusz','Gontarek','Okopowa',59,525,'Warszawa','00-000','headadmin','Python',null, 'MojeSuperTajneiBezpieczneHaslo2022', 'MatGon'),
('Julian','Korgol','Okopowa ',59,525,'Warszawa','10-000','headadmin','Linux',null,'1234567890','julia'),
('Oliwier','Bernatowicz','Wiejska ',69,420,'Warszawa','69-420','user','JavaScript',1, 'admin1','Ollson'),
('Mi�osz','Pierzak','Okopowa', 59,525,'Warszawa','10-000','user','MapMaker',2, 'admin2','Pierzak')

INSERT INTO Zaloga VALUES
(2,2),
(3,2),
(4,2)
