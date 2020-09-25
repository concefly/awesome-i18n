import { LoadResult, LoadResultItem } from "ai18n-type";
import Reducer from "../lib";

describe("reduce", () => {
  test("合并相同 key", () => {
    const result = new Reducer().reduce(
      new LoadResult([
        new LoadResultItem("香蕉", "a"),
        new LoadResultItem("香蕉", "b"),
        new LoadResultItem("香蕉"),
        new LoadResultItem("苹果 {name}"),
        new LoadResultItem("西瓜"),
        new LoadResultItem("西瓜"),
      ]),
      new LoadResult([])
    );

    expect(result).toMatchSnapshot();
  });

  test("新增 & 删除", () => {
    const result = new Reducer().reduce(
      new LoadResult([
        new LoadResultItem("香蕉", "c"),
        new LoadResultItem("苹果 {name}"),
      ]),
      new LoadResult([
        new LoadResultItem("香蕉", "a"),
        new LoadResultItem("香蕉", "b"),
        new LoadResultItem("雪梨"),
      ])
    );

    expect(result).toMatchSnapshot();
  });

  test("冲突场景 - 保留原来的翻译", () => {
    const result = new Reducer().reduce(
      new LoadResult([new LoadResultItem("香蕉", undefined)]),
      new LoadResult([new LoadResultItem("香蕉", undefined, { msg: "banana" })])
    );

    expect(result).toMatchSnapshot();
  });

  test("冲突场景 - 冲突文案的新上下文复用翻译", () => {
    const result = new Reducer().reduce(
      new LoadResult([new LoadResultItem("香蕉", "a")]),
      new LoadResult([new LoadResultItem("香蕉", undefined, { msg: "banana" })])
    );
    expect(result).toMatchSnapshot();
  });
});

describe("extract", () => {
  it("extract", () => {
    const result = new Reducer().extract({
      香蕉: "香蕉 {name}",
      苹果: "{description, select, a{apple_a} b{apple_b}}",
    });

    expect(result).toMatchSnapshot();
  });
});
