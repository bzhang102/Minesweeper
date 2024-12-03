--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: persons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persons (
    username character varying(255),
    userpassword character varying(255),
    accesstoken character varying(255),
    easy_solve_time INTEGER DEFAULT NULL,
    medium_solve_time INTEGER DEFAULT NULL,
    hard_solve_time INTEGER DEFAULT NULL,
    easy_solve_partners TEXT[] DEFAULT ARRAY[]::TEXT[],
    medium_solve_partners TEXT[] DEFAULT ARRAY[]::TEXT[],
    hard_solve_partners TEXT[] DEFAULT ARRAY[]::TEXT[]
);

--
-- PostgreSQL database dump complete
--