-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: detodounpoco
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cuentas`
--

DROP TABLE IF EXISTS `cuentas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuentas` (
  `ID_CUENTA` int NOT NULL AUTO_INCREMENT,
  `NOMBRE` varchar(100) NOT NULL,
  `EMAIL` varchar(100) NOT NULL,
  `PASSWORD` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `token_sesion` varchar(255) DEFAULT NULL,
  `ROL` enum('Invitado','Cliente','Vendedor','Administrador') NOT NULL DEFAULT 'Cliente',
  `IMAGEN` varchar(255) DEFAULT NULL,
  `ACTIVO` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID_CUENTA`),
  UNIQUE KEY `EMAIL` (`EMAIL`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas`
--

LOCK TABLES `cuentas` WRITE;
/*!40000 ALTER TABLE `cuentas` DISABLE KEYS */;
INSERT INTO `cuentas` VALUES (1,'Luis','LuisEnrique@gmail.com','Le982895544',NULL,'Administrador',NULL,1),(2,'Angel','PerezAngel@gmail.com','Pa123456789',NULL,'Vendedor',NULL,1),(3,'Juan','JuanBautista@gmail.com','Jb987654321',NULL,'Cliente',NULL,1),(4,'Angel','angel@gmail.com','jA12345678',NULL,'Administrador',NULL,1),(5,'prueba','prueba@gmail.com','jA12345678',NULL,'Administrador',NULL,1),(6,'AngeliTOO','cliente@gmail.com','jA12345678',NULL,'Cliente',NULL,1);
/*!40000 ALTER TABLE `cuentas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_detalle`
--

DROP TABLE IF EXISTS `pedido_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_detalle` (
  `ID_DETALLE` int NOT NULL AUTO_INCREMENT,
  `ID_PEDIDO` int NOT NULL,
  `ID_PLATILLO` int NOT NULL,
  `CANTIDAD` int NOT NULL,
  `PRECIO_UNITARIO` decimal(10,2) NOT NULL,
  PRIMARY KEY (`ID_DETALLE`),
  KEY `ID_PEDIDO` (`ID_PEDIDO`),
  KEY `ID_PLATILLO` (`ID_PLATILLO`),
  CONSTRAINT `pedido_detalle_ibfk_1` FOREIGN KEY (`ID_PEDIDO`) REFERENCES `pedidos` (`ID_PEDIDO`) ON DELETE CASCADE,
  CONSTRAINT `pedido_detalle_ibfk_2` FOREIGN KEY (`ID_PLATILLO`) REFERENCES `platillos` (`ID_PLATILLO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_detalle`
--

LOCK TABLES `pedido_detalle` WRITE;
/*!40000 ALTER TABLE `pedido_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedido_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `ID_PEDIDO` int NOT NULL AUTO_INCREMENT,
  `ID_CUENTA` int NOT NULL,
  `FECHA_COMPRA` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `TOTAL` decimal(10,2) DEFAULT '0.00',
  `ESTADO` enum('prep','ready','done') DEFAULT 'prep',
  PRIMARY KEY (`ID_PEDIDO`),
  KEY `ID_CUENTA` (`ID_CUENTA`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`ID_CUENTA`) REFERENCES `cuentas` (`ID_CUENTA`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platillos`
--

DROP TABLE IF EXISTS `platillos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platillos` (
  `ID_PLATILLO` int NOT NULL AUTO_INCREMENT,
  `NOMBRE` varchar(100) NOT NULL,
  `PRECIO` decimal(10,2) NOT NULL,
  `DISPONIBLE` tinyint(1) DEFAULT '1',
  `DESCRIPCION` text,
  `IMAGEN` varchar(255) DEFAULT NULL,
  `CATEGORIA` varchar(50) DEFAULT NULL,
  `ACTIVO` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID_PLATILLO`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platillos`
--

LOCK TABLES `platillos` WRITE;
/*!40000 ALTER TABLE `platillos` DISABLE KEYS */;
INSERT INTO `platillos` VALUES (1,'Tacos al pastor',25.00,1,'Con piña y salsa verde','3-tacos-al-pastor.jpeg','Tacos',1),(2,'Hamburguesa clásica',89.00,1,'Carne 150g, queso, jitomate','hamburguesa-clasica.jpg','Hamburguesa',1),(3,'Agua de horchata',25.00,1,'500 ml','Agua_de_horchata.jpg','Bebida',1);
/*!40000 ALTER TABLE `platillos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reseñas`
--

DROP TABLE IF EXISTS `reseñas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reseñas` (
  `ID_RESEÑA` int NOT NULL AUTO_INCREMENT,
  `ID_PLATILLO` int DEFAULT NULL,
  `ID_CUENTA` int DEFAULT NULL,
  `CALIFICACION` int DEFAULT NULL,
  `COMENTARIOS` text,
  `FECHA` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_RESEÑA`),
  KEY `ID_PLATILLO` (`ID_PLATILLO`),
  KEY `ID_CUENTA` (`ID_CUENTA`),
  CONSTRAINT `reseñas_ibfk_1` FOREIGN KEY (`ID_PLATILLO`) REFERENCES `platillos` (`ID_PLATILLO`),
  CONSTRAINT `reseñas_ibfk_2` FOREIGN KEY (`ID_CUENTA`) REFERENCES `cuentas` (`ID_CUENTA`),
  CONSTRAINT `reseñas_chk_1` CHECK ((`calificacion` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reseñas`
--

LOCK TABLES `reseñas` WRITE;
/*!40000 ALTER TABLE `reseñas` DISABLE KEYS */;
/*!40000 ALTER TABLE `reseñas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-15 11:04:38
