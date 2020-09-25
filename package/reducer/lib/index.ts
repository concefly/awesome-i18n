import * as _ from "lodash";
import {
  BaseReducer,
  ExtractResult,
  ExtractResultItem,
  ICUItem,
  ILocalizeMsgMap,
  LoadResult,
  ReduceResult,
  ReduceResultItem,
} from "ai18n-type";

export default class Reducer extends BaseReducer {
  extract(json: ILocalizeMsgMap): ExtractResult {
    const result = new ExtractResult([]);

    _.forEach(json, (value, key) => {
      const selectMatch = value.match(/^\{description,\s+select,\s+(.*)\}$/);
      if (selectMatch) {
        const optionList = selectMatch[1].split(/\s+/);

        optionList.forEach((opt) => {
          const optMatch = opt.match(/^(.*)\{(.*)\}/);
          if (optMatch) {
            const [, description, msg] = optMatch;
            result.add(new ExtractResultItem(key, description, { msg }));
          }
        });

        return;
      }

      result.add(new ExtractResultItem(key, undefined, { msg: value }));
    });

    return result;
  }

  reduce(incoming: LoadResult, src: ExtractResult): ReduceResult {
    const incomingGroup = _.groupBy(incoming.list, (d) => d.key);
    const srcGroup = _.groupBy(src.list, (d) => d.key);

    const incomingKeys = Object.keys(incomingGroup);
    const srcKeys = Object.keys(srcGroup);

    const addKeys = _.difference(incomingKeys, srcKeys);
    const modifyKeys = _.intersection(incomingKeys, srcKeys);

    const result = new ReduceResult();

    // 处理新进入的 key
    addKeys.forEach((key) => {
      const list = incomingGroup[key];

      if (list.length === 1) {
        result.data.set(key, new ReduceResultItem(new ICUItem(key, [key])));
      } else {
        // 按 description 分组
        const descGroup = _.groupBy(list, (d) => d.description);

        if (Object.keys(descGroup).length === 1) {
          // 只有一个 description
          result.data.set(key, new ReduceResultItem(new ICUItem(key, [key])));
        } else {
          const translates = new Set<string>();
          let optionList: string[] = [];
          _.map(descGroup, ([d], desc) => {
            translates.add(d.key);
            optionList.push(`${desc}{${d.key}}`);
          });

          // 排序
          optionList.sort();

          result.data.set(
            key,
            new ReduceResultItem(
              new ICUItem(`{description, select, ${optionList.join(" ")}}`, [
                ...translates,
              ])
            )
          );
        }
      }
    });

    // 处理修改的 key
    modifyKeys.forEach((key) => {
      const incomingList = incomingGroup[key].map((d) => ({
        d,
        from: "incoming",
      }));
      const srcList = srcGroup[key].map((d) => ({
        d,
        from: "src",
      }));

      // 按 description 分组
      const descGroup = _.groupBy(
        [...incomingList, ...srcList],
        (d) => d.d.description
      );

      const translates = new Set<string>();
      let optionList: string[] = [];
      _.map(descGroup, (descList, desc) => {
        // 尝试找翻译文案
        const msg =
          // 首先找 src 当前 description 的列表
          descList.find((d) => d.from === "src" && d.d.extra?.msg)?.d.extra
            ?.msg ||
          // 然后找 src 当前 key 的列表
          srcList.find((d) => d.d.extra?.msg)?.d.extra?.msg ||
          // 最后回退 key
          key;

        if (msg === key) translates.add(key);

        optionList.push(`${desc}{${msg}}`);
      });

      // 排序
      optionList.sort();

      result.data.set(
        key,
        new ReduceResultItem(
          new ICUItem(`{description, select, ${optionList.join(" ")}}`, [
            ...translates,
          ])
        )
      );
    });

    return result;
  }
}
