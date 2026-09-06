/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";

/**
 * React synthesises onMouseEnter/onMouseLeave from mouseover/mouseout, so a
 * native `mouseenter` (which does not bubble) never reaches the handler. Fire
 * the events React actually listens for.
 */
const hover = (el: Element) => fireEvent.mouseOver(el);
const unhover = (el: Element) => fireEvent.mouseOut(el);
import { Tooltip } from "@/components/tooltip";

/** jsdom reports a zero rect for everything, so triggers get one explicitly. */
function placeTrigger(el: Element, rect: Partial<DOMRect>) {
  const full = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect;
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(full);
}

function bubble() {
  return document.querySelector(".tooltip");
}

beforeEach(() => {
  window.innerWidth = 1000;
  window.innerHeight = 800;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Tooltip", () => {
  it("shows nothing until the trigger is hovered", () => {
    render(
      <Tooltip label="Languages" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    expect(bubble()).toBeNull();
  });

  it("renders the label on hover, into document.body rather than in place", () => {
    render(
      <Tooltip label="Languages" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    placeTrigger(trigger, { top: 100, bottom: 140, left: 20, right: 60, width: 40, height: 40 });

    hover(trigger.parentElement!);

    const tip = bubble();
    expect(tip).not.toBeNull();
    expect(tip!.textContent).toBe("Languages");
    // The portal is the whole reason this component exists: an in-place bubble
    // is clipped by a scrolling ancestor and mispositioned by a transformed one.
    expect(tip!.parentElement).toBe(document.body);
  });

  it("hides again on mouse leave", () => {
    render(
      <Tooltip label="Languages" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const wrapper = screen.getByRole("button").parentElement!;
    placeTrigger(screen.getByRole("button"), { top: 100, bottom: 140, right: 60 });

    hover(wrapper);
    expect(bubble()).not.toBeNull();

    unhover(wrapper);
    expect(bubble()).toBeNull();
  });

  it("opens on keyboard focus, not only on hover", () => {
    render(
      <Tooltip label="Languages" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    placeTrigger(trigger, { top: 100, bottom: 140, right: 60 });

    // React delegates onFocus from `focusin`, which bubbles; a plain `focus`
    // event does not and would never reach the wrapper.
    fireEvent.focusIn(trigger);
    expect(bubble()).not.toBeNull();
  });

  it("is hidden from assistive tech, because it repeats the trigger's name", () => {
    render(
      <Tooltip label="Languages" delay={0}>
        <button aria-label="Languages">trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    placeTrigger(trigger, { top: 100, bottom: 140, right: 60 });

    hover(trigger.parentElement!);
    expect(bubble()!.getAttribute("aria-hidden")).toBe("true");
  });

  it("dismisses on Escape", () => {
    render(
      <Tooltip label="Languages" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    placeTrigger(trigger, { top: 100, bottom: 140, right: 60 });

    hover(trigger.parentElement!);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(bubble()).toBeNull();
  });

  it("dismisses on scroll, so it cannot sit over content that moved", () => {
    render(
      <Tooltip label="Languages" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    placeTrigger(trigger, { top: 100, bottom: 140, right: 60 });

    hover(trigger.parentElement!);
    fireEvent.scroll(window);
    expect(bubble()).toBeNull();
  });

  it("waits for the delay before opening", () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip label="Languages" delay={250}>
          <button>trigger</button>
        </Tooltip>,
      );
      const trigger = screen.getByRole("button");
      placeTrigger(trigger, { top: 100, bottom: 140, right: 60 });

      hover(trigger.parentElement!);
      expect(bubble()).toBeNull();

      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(bubble()).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not open at all if the pointer leaves before the delay elapses", () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip label="Languages" delay={250}>
          <button>trigger</button>
        </Tooltip>,
      );
      const wrapper = screen.getByRole("button").parentElement!;
      placeTrigger(screen.getByRole("button"), { top: 100, bottom: 140, right: 60 });

      hover(wrapper);
      unhover(wrapper);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(bubble()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Tooltip placement", () => {
  it("keeps the requested side when there is room", () => {
    render(
      <Tooltip label="ok" side="right" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    placeTrigger(trigger, { top: 400, bottom: 440, left: 20, right: 60, height: 40 });

    hover(trigger.parentElement!);
    expect(bubble()!.getAttribute("data-side")).toBe("right");
  });

  it("flips to the opposite side rather than overflowing the viewport", () => {
    render(
      <Tooltip label="a long enough label to matter" side="right" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    // Hard against the right edge: "right" cannot fit, "left" can.
    placeTrigger(trigger, { top: 400, bottom: 440, left: 960, right: 995, height: 40 });

    hover(trigger.parentElement!);
    expect(bubble()!.getAttribute("data-side")).toBe("left");
  });

  it("flips a top tooltip to the bottom when the trigger is at the top edge", () => {
    render(
      <Tooltip label="ok" side="top" delay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    placeTrigger(trigger, { top: 2, bottom: 30, left: 400, right: 440, width: 40, height: 28 });

    hover(trigger.parentElement!);
    expect(bubble()!.getAttribute("data-side")).toBe("bottom");
  });
});

describe("Tooltip onlyWhenTruncated", () => {
  function renderTruncating(scrollWidth: number, clientWidth: number) {
    const view = render(
      <Tooltip label="sorting-and-searching" onlyWhenTruncated delay={0}>
        <a href="#x">
          <span data-truncate>sorting-and-searching</span>
        </a>
      </Tooltip>,
    );
    const link = screen.getByRole("link");
    placeTrigger(link, { top: 100, bottom: 132, left: 10, right: 200 });

    const inner = link.querySelector("[data-truncate]")!;
    Object.defineProperty(inner, "scrollWidth", { value: scrollWidth, configurable: true });
    Object.defineProperty(inner, "clientWidth", { value: clientWidth, configurable: true });
    return { view, link };
  }

  it("stays silent when the text fits", () => {
    const { link } = renderTruncating(100, 200);
    hover(link.parentElement!);
    expect(bubble()).toBeNull();
  });

  it("appears when the text is actually ellipsised", () => {
    const { link } = renderTruncating(300, 120);
    hover(link.parentElement!);
    expect(bubble()!.textContent).toBe("sorting-and-searching");
  });
});
