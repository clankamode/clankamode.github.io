INSERT INTO "Users" (email, role)
VALUES ('plannerlesson34@gmail.com', 'INSIDER')
ON CONFLICT (email) DO UPDATE SET role = 'INSIDER';
