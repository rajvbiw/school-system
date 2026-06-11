resource "aws_secretsmanager_secret" "db_password" {
  name = "school-erp/db-password"
}

resource "aws_secretsmanager_secret_version" "db_pass" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = "CHANGE_ME"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "school-erp/jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = "CHANGE_ME_32_CHARS_MIN"
}

resource "aws_secretsmanager_secret" "jwt_refresh" {
  name = "school-erp/jwt-refresh-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_ref" {
  secret_id     = aws_secretsmanager_secret.jwt_refresh.id
  secret_string = "CHANGE_ME_32_CHARS_MIN"
}
