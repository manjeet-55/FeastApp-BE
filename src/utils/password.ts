import bcrypt from "bcryptjs";
import { UserDocument } from "./types";

const validatePassword = (user: UserDocument, password: string) => {
  try {
    return bcrypt.compareSync(password, user.password);
  } catch (error) {
    return error.message;
  }
};

const hashPassword = async (password:string) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    return error.message;
  }
};

export default { validatePassword, hashPassword };
