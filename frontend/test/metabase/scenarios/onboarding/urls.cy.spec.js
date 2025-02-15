import { restore, navigationSidebar, popover } from "__support__/e2e/cypress";
import { SAVED_QUESTIONS_VIRTUAL_DB_ID } from "metabase/lib/saved-questions";

describe("URLs", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  describe("browse databases", () => {
    it(`should slugify database name when opening it from /browse"`, () => {
      cy.visit("/browse");
      cy.findByTextEnsureVisible("Sample Database").click();
      cy.findByText("Sample Database");
      cy.location("pathname").should("eq", "/browse/1-sample-database");
    });

    [
      `/browse/${SAVED_QUESTIONS_VIRTUAL_DB_ID}`,
      `/browse/${SAVED_QUESTIONS_VIRTUAL_DB_ID}-saved-questions`,
    ].forEach(url => {
      it("should open 'Saved Questions' database correctly", () => {
        cy.visit(url);
        cy.findByText("Saved Questions");
        cy.location("pathname").should("eq", url);
      });
    });
  });

  describe("dashboards", () => {
    it("should slugify dashboard URLs", () => {
      cy.visit("/collection/root");
      cy.findByText("Orders in a dashboard").click();
      cy.location("pathname").should(
        "eq",
        "/dashboard/1-orders-in-a-dashboard",
      );
    });
  });

  describe("questions", () => {
    it("should slugify question URLs", () => {
      cy.visit("/collection/root");
      cy.findByText("Orders").click();
      cy.location("pathname").should("eq", "/question/1-orders");
    });
  });

  describe("collections", () => {
    it("should slugify collection name", () => {
      cy.visit("/collection/root");
      cy.findByText("First collection").click();
      cy.location("pathname").should("eq", "/collection/9-first-collection");
    });

    it("should slugify current user's personal collection name correctly", () => {
      cy.visit("/collection/root");
      cy.findByText("Your personal collection").click();
      cy.location("pathname").should(
        "eq",
        "/collection/1-bobby-tables-s-personal-collection",
      );
    });

    it("should not slugify users' collections page URL", () => {
      cy.visit("/collection/root");
      navigationSidebar().within(() => {
        cy.icon("ellipsis").click();
      });
      popover()
        .findByText("Other users' personal collections")
        .click();
      cy.findByText("All personal collections");
      cy.location("pathname").should("eq", "/collection/users");
    });

    it("should slugify users' personal collection URLs", () => {
      cy.visit("/collection/users");
      cy.findByText("Robert Tableton").click();
      cy.location("pathname").should(
        "eq",
        "/collection/8-robert-tableton-s-personal-collection",
      );
    });

    it("should open slugified URLs correctly", () => {
      cy.visit("/collection/9-first-collection");
      cy.findByTestId("collection-name-heading").should(
        "have.text",
        "First collection",
      );

      cy.visit("/collection/1-bobby-tables-s-personal-collection");
      cy.findByTestId("collection-name-heading").should(
        "have.text",
        "Bobby Tables's Personal Collection",
      );

      cy.visit("/collection/8-robert-tableton-s-personal-collection");
      cy.findByTestId("collection-name-heading").should(
        "have.text",
        "Robert Tableton's Personal Collection",
      );
    });
  });
});
