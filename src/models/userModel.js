import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getAllUsersService = async () => {
  const result = await pool.query("SELECT id,name,email,role FROM users");
  return result.rows;
};
export const getUserByIdService = async (id) => {
  const result = await pool.query(
    "SELECT id,name,email,role FROM users where id = $1",
    [id]
  );

  return result.rows[0];
};
export const createUserService = async (name, email, password, role) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const result = await pool.query(
    "INSERT INTO users (name, email,password,role) VALUES ($1, $2,$3,$4) RETURNING *",
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};
export const loginUserService = async (email, password) => {
  const userResult = await pool.query(
    "SELECT id, name, email, password, role FROM users WHERE email = $1",
    [email]
  );

  if (userResult.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult.rows[0];

  // Compare hashed passwords
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid credentials");
  }
  return user;
};
export const logoutUserService = async (id) => {
  try {
    const result = await pool.query(
      "UPDATE users SET refresh_token=$1 WHERE id=$2 RETURNING *",
      [null, id]
    );
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error in LogoutUserService:", error.message);
    throw new Error("Database Error while logging out user");
  }
};
export const updateUserService = async (id, name, email) => {
  const result = await pool.query(
    "UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email) WHERE id=$3 RETURNING *",
    [name, email, id]
  );
  return result.rows[0];
};
export const deleteUserService = async (id) => {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
