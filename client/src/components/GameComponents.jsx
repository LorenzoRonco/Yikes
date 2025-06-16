import React from "react";
import { useLocation, useParams } from "react-router";
import { useEffect, useState, Fragment } from "react";
import { Card, Button, Container, Row, Col, Spinner, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import API from "../API/API.mjs";
import 'bootstrap/dist/css/bootstrap.min.css';

function PlayerHand({ initialCards, handleInsertCard }) {
  return (
    <>
      <h4 style={{ fontWeight: '500', color: '#E45341' }}>Player's hand</h4>
      <Row className="flex-nowrap overflow-auto">
        <Col xs="auto" className="d-flex align-items-center">
          <Button
            style={{
              padding: "6px 16px",
              fontSize: "0.9rem",
              borderRadius: "8px",
              backgroundColor: "#57b8d4",
              borderColor: "#57b8d4",
              boxShadow: "0 3px 6px rgb(228 83 65 / 0.3)",
              fontWeight: "700",
              color: "white",
              whiteSpace: "nowrap",
              minWidth: "100px",
            }}
            variant="primary"
            onClick={() => handleInsertCard(0)}>Insert here</Button>
        </Col>

        {initialCards
          .sort((c1, c2) => c1.misfortune - c2.misfortune)
          .map((card, idx) => (
            <Fragment key={card.id}>
              <Col xs="auto">
                <Card
                  className="shadow rounded-4 overflow-hidden border-0 mb-3"
                  style={{ width: '15rem' }}
                >
                  <Card.Img
                    variant="top"
                    src={API.SERVER_URL + card.imageUrl}
                    alt={card.title}
                    style={{ height: '160px', objectFit: 'cover' }}
                  />
                  <Card.Body className="d-flex flex-column justify-content-between">
                    <Card.Title className="fw-bold text-dark text-center">{card.title}</Card.Title>
                    <Card.Subtitle className="fw-bold text-dark text-center">Misfortune: {card.misfortune}</Card.Subtitle>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs="auto" className="d-flex align-items-center">
                <Button style={{
                  padding: "6px 16px",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  backgroundColor: "#57b8d4",
                  borderColor: "#57b8d4",
                  boxShadow: "0 3px 6px rgb(228 83 65 / 0.3)",
                  fontWeight: "700",
                  color: "white",
                  whiteSpace: "nowrap",
                  minWidth: "100px",
                }}
                  variant="primary" onClick={() => handleInsertCard(idx + 1)}>
                  Insert here
                </Button>
              </Col>
            </Fragment>
          ))}
      </Row>
    </>
  );
}


function NewCardSection({ newCard }) {
  if (!newCard) return null;
  return (
    <>
      <Row className="mb-4 justify-content-center">
        <Col xs={12} md={4} className="d-flex flex-column align-items-center">
          <h4 className="mb-3 text-center lead text-secondary">New Card</h4>
          <Card
            className="shadow rounded-4 overflow-hidden border-0 mb-3"
            style={{ width: '15rem' }}
          >
            <Card.Img
              variant="top"
              src={API.SERVER_URL + newCard.imageUrl}
              alt={newCard.title}
              style={{ height: '160px', objectFit: 'cover' }}
            />
            <Card.Body className="d-flex flex-column justify-content-between">
              <Card.Title className="fw-bold text-dark text-center">{newCard.title}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export {PlayerHand, NewCardSection};