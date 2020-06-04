create database tightknit;

use tightknit;


    
    
create table Groupp (
	GroupID int NOT NULL AUTO_INCREMENT,
    PRIMARY KEY(GroupID),
    GroupCategory char(20),
    NumberOfPeopleInGroup int
);

create table accounts (
	UserID int NOT NULL AUTO_INCREMENT,
    PRIMARY KEY(UserID),
	AdministratorFlag boolean,
	FirstName Char(25),
    LastName Char(25),
    Bio Char(200),
    Email char(40),
    Passwd char(255),
    GroupID int,
    FOREIGN KEY (GroupID) REFERENCES Groupp(GroupID),
    ProfilePicture BLOB,
    NumVotes int
    
	);

create table posts (
	UserID int NOT NULL,
    FOREIGN KEY(UserID) REFERENCES accounts(UserID),
    PostID int NOT NULL AUTO_INCREMENT,
    PRIMARY KEY(PostID),
    PostContent char(200),
    TimeOffPost datetime  
    );

create table comments (
	CommentID int NOT NULL AUTO_INCREMENT,
    PRIMARY KEY(CommentID),
	UserID int NOT NULL,
    FOREIGN KEY(UserID) REFERENCES accounts(UserID),
    PostID int NOT NULL,
    FOREIGN KEY(PostID) REFERENCES posts(PostID),
    CommentContent char(200),
    TimeOfComment datetime  
    );


insert into accounts (UserID, AdministratorFlag, FirstName, LastName, Bio, Email, Passwd, NumVotes)
values (1, false, 'miles', 'foret', 'i like this site', 'mforet@uncc.edu', 'password', 0 );