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
  PRIMARY KEY (`ID_PLATILLO`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platillos`
--

LOCK TABLES `platillos` WRITE;
/*!40000 ALTER TABLE `platillos` DISABLE KEYS */;
INSERT INTO `platillos` VALUES (1,'Tacos al pastor',15.00,1,'Con piña y salsa verde','3-tacos-al-pastor.jpeg','Tacos'),(2,'Hamburguesa clásica',89.00,1,'Carne 150g, queso, jitomate','hamburguesa-clasica.jpg','Hamburguesa'),(3,'Agua de horchata',25.00,1,'500 ml','Agua_de_horchata.jpg','Bebida'),(4,'Tostadas de Tinga',50.00,1,'3 tostadas de tinga de pollo con cebolla morada','Tinga-Feature.jpg','Tostadas'),(5,'Tostadas de Pata',80.00,1,'4 Tostadas de pata','Tostadas_de_Pata.jpg','Tostadas'),(6,'Tacos de carne Enchilada',30.00,1,'1 taco de carne Enchilada','Enchilada-ta-02.jpg','Tacos');
/*!40000 ALTER TABLE `platillos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-05 10:30:51
