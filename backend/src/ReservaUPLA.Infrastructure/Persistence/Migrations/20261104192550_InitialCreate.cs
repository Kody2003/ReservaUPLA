using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReservaUPLA.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ambientes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    capacidad = table.Column<int>(type: "integer", nullable: false),
                    ubicacion = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ambientes", x => x.id);
                    table.CheckConstraint("ck_ambientes_capacidad", "capacidad > 0");
                    table.CheckConstraint("ck_ambientes_estado", "estado IN ('Disponible','Mantenimiento','Inactivo')");
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nombre_completo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    correo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    rol = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.id);
                    table.CheckConstraint("ck_usuarios_rol", "rol IN ('Solicitante','Administrador','ResponsableAmbiente')");
                });

            migrationBuilder.CreateTable(
                name: "reservas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    hora_inicio = table.Column<TimeOnly>(type: "time", nullable: false),
                    hora_fin = table.Column<TimeOnly>(type: "time", nullable: false),
                    motivo = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ambiente_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reservas", x => x.id);
                    table.CheckConstraint("ck_reservas_estado", "estado IN ('Pendiente','Aprobada','Rechazada','Cancelada')");
                    table.CheckConstraint("ck_reservas_hora_fin", "hora_fin > hora_inicio");
                    table.CheckConstraint("ck_reservas_horario_permitido", "hora_inicio >= TIME '07:00' AND hora_fin <= TIME '22:00'");
                    table.ForeignKey(
                        name: "FK_reservas_ambientes_ambiente_id",
                        column: x => x.ambiente_id,
                        principalTable: "ambientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reservas_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_reservas_ambiente_fecha_estado",
                table: "reservas",
                columns: new[] { "ambiente_id", "fecha", "estado" });

            migrationBuilder.CreateIndex(
                name: "IX_reservas_usuario_id",
                table: "reservas",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ux_usuarios_correo",
                table: "usuarios",
                column: "correo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reservas");

            migrationBuilder.DropTable(
                name: "ambientes");

            migrationBuilder.DropTable(
                name: "usuarios");
        }
    }
}
