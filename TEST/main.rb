#!/usr/bin/env ruby
# encoding: utf-8
#
# 模拟 Git 提交历史测试脚本
# 在 TEST 文件夹内生成文件，提交到主仓库 (HerbTable.com) 的 master 分支
#
# 运行方式: cd TEST && ruby main.rb

require 'date'
require 'fileutils'
require 'securerandom'

# 主仓库路径 (TEST 的父目录)
REPO_DIR = File.expand_path(File.join(File.dirname(__FILE__), '..'))
# 相对于主仓库的文件路径
CODE_FILE = 'TEST/code.txt'
TZ = '+0800'

def make_commit(timestamp, lines)
  Dir.chdir(REPO_DIR) do
    content = (1..lines).map { |i|
      "// #{SecureRandom.hex(4)} - line #{i} - #{timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n"
    }.join
    File.write(CODE_FILE, content)

    result = system("git add \"#{CODE_FILE}\"", out: File::NULL)
    return false unless result

    date_str = timestamp.strftime('%Y-%m-%d %H:%M:%S') + " #{TZ}"
    msg = "commit #{timestamp.strftime('%Y%m%d%H%M%S')}"

    env = {
      'GIT_AUTHOR_DATE' => date_str,
      'GIT_COMMITTER_DATE' => date_str
    }

    success = system(env, "git commit -m \"#{msg}\"", out: File::NULL, err: File::NULL)
    if success
      puts "  \u2713 #{timestamp.strftime('%Y-%m-%d %H:%M:%S')}  #{'%5d' % lines} 行"
    else
      puts "  \u2717 #{timestamp.strftime('%Y-%m-%d %H:%M:%S')}  提交失败"
    end
    success
  end
end

def weighted_random_hour(weights)
  total = weights.sum { |w| w[2] }
  r = rand * total
  cumulative = 0
  weights.each do |start_h, end_h, weight|
    cumulative += weight
    if r <= cumulative
      return rand(start_h...end_h)
    end
  end
  rand(0..23)
end

def random_second
  rand(0..59)
end

def random_minute
  rand(0..59)
end

def make_time(year, month, day, hour, min, sec)
  Time.new(year, month, day, hour, min, sec, TZ)
rescue ArgumentError
  nil
end

# ============================================================
# 主流程
# ============================================================
puts '=' * 60
puts '  模拟 Git 提交历史生成器'
puts '  时间范围: 2024-12-19 \u2192 2025-12-31'
puts '=' * 60

total_commits = 0

# ============================================================
# 阶段1: 初始爆发期 (2024-12-19 22:46:41 \u2192 2025-01-01)
# 36 次提交，集中在凌晨(0-6点)和下午(12-18点)，上午少
# 代码量从几千几万逐渐减少到几百几十
# ============================================================
puts "\n【阶段1】初始爆发期 2024-12-19 \u2192 2025-01-01"
puts '-' * 60

start_t = Time.new(2024, 12, 19, 22, 46, 41, TZ)
end_t   = Time.new(2025, 1, 1, 0, 0, 0, TZ)
range_seconds = (end_t - start_t).to_i

hour_weights = [[0, 6, 5], [6, 12, 1], [12, 18, 5], [18, 24, 2]]

days_in_phase = (end_t.to_date - start_t.to_date).to_i
commits_per_day = Array.new(days_in_phase + 1, 0)

36.times do
  day_offset = rand(0..days_in_phase)
  commits_per_day[day_offset] += 1
end

timestamps_phase1 = []
commits_per_day.each_with_index do |count, day_offset|
  next if count == 0
  base_date = start_t.to_date + day_offset
  count.times do
    hour = weighted_random_hour(hour_weights)
    min = random_minute
    sec = random_second
    ts = make_time(base_date.year, base_date.month, base_date.day, hour, min, sec)
    timestamps_phase1 << ts if ts
  end
end

timestamps_phase1 = timestamps_phase1.select { |t| t >= start_t && t < end_t }.sort

while timestamps_phase1.size < 36
  random_offset = rand(0..range_seconds)
  ts = start_t + random_offset
  hour = weighted_random_hour(hour_weights)
  ts = make_time(ts.year, ts.month, ts.day, hour, random_minute, random_second)
  timestamps_phase1 << ts if ts && ts >= start_t && ts < end_t
  timestamps_phase1 = timestamps_phase1.uniq.sort
end

timestamps_phase1 = timestamps_phase1.first(36).sort

timestamps_phase1.each_with_index do |ts, i|
  progress = i.to_f / timestamps_phase1.length
  lines = if progress < 0.1
            rand(3000..8000)
          elsif progress < 0.25
            rand(1000..3000)
          elsif progress < 0.4
            rand(500..1000)
          elsif progress < 0.55
            rand(200..500)
          elsif progress < 0.7
            rand(80..200)
          elsif progress < 0.85
            rand(30..80)
          else
            rand(10..30)
          end
  make_commit(ts, lines)
  total_commits += 1
end

puts "  \u2192 阶段1 完成: #{timestamps_phase1.size} 次提交"

# ============================================================
# 阶段2: 1月份不提交
# ============================================================
puts "\n【阶段2】1月静默期 (无提交)"

# ============================================================
# 阶段3: 第1个月 (2025年2月) - 3行代码，一天一行，随机
# ============================================================
puts "\n【阶段3】第1个月 (2025-02) - 3次提交，每行1行代码"
puts '-' * 60

feb_days = (1..28).to_a.sample(3).sort
feb_days.each do |day|
  hour = rand(8..20)
  ts = make_time(2025, 2, day, hour, random_minute, random_second)
  make_commit(ts, 1) if ts
  total_commits += 1
end

# ============================================================
# 阶段4: 第2个月 (2025年3月) - 2行代码，一天一行，随机
# ============================================================
puts "\n【阶段4】第2个月 (2025-03) - 2次提交，每行1行代码"
puts '-' * 60

mar_days = (1..31).to_a.sample(2).sort
mar_days.each do |day|
  hour = rand(8..20)
  ts = make_time(2025, 3, day, hour, random_minute, random_second)
  make_commit(ts, 1) if ts
  total_commits += 1
end

# ============================================================
# 阶段5: 第3~5个月 (2025-04 ~ 2025-06)
# 每天提交，固定在晚上9点到11点
# 代码量不稳定，有时几行，有时几百行
# ============================================================
puts "\n【阶段5】第3~5个月 (2025-04 ~ 2025-06) - 每天提交，晚上9~11点"
puts '-' * 60

(4..6).each do |month|
  days_in_month = Date.new(2025, month, -1).day
  (1..days_in_month).each do |day|
    hour = rand(21..23)
    min = random_minute
    sec = random_second
    ts = make_time(2025, month, day, hour, min, sec)
    next unless ts

    lines = if rand < 0.3
              rand(3..10)
            elsif rand < 0.6
              rand(10..50)
            else
              rand(50..500)
            end
    make_commit(ts, lines)
    total_commits += 1
  end
end

# ============================================================
# 阶段6: 第5~6个月 (2025-06 ~ 2025-07)
# 十多天，每次十几二十行
# ============================================================
puts "\n【阶段6】第5~6个月 (2025-06 ~ 2025-07) - 十多天，每次十几二十行"
puts '-' * 60

june_extra_days = (1..30).to_a.sample(10).sort
june_extra_days.each do |day|
  hour = rand(9..22)
  ts = make_time(2025, 6, day, hour, random_minute, random_second)
  next unless ts
  lines = rand(10..20)
  make_commit(ts, lines)
  total_commits += 1
end

july_days = (1..31).to_a.sample(12).sort
july_days.each do |day|
  hour = rand(9..22)
  ts = make_time(2025, 7, day, hour, random_minute, random_second)
  next unless ts
  lines = rand(10..20)
  make_commit(ts, lines)
  total_commits += 1
end

# ============================================================
# 阶段7: 第7个月 (2025-08) - 十多天，跟第6月一样
# ============================================================
puts "\n【阶段7】第7个月 (2025-08) - 十多天，跟第6月一样"
puts '-' * 60

aug_days = (1..31).to_a.sample(12).sort
aug_days.each do |day|
  hour = rand(9..22)
  ts = make_time(2025, 8, day, hour, random_minute, random_second)
  next unless ts
  lines = rand(10..20)
  make_commit(ts, lines)
  total_commits += 1
end

# ============================================================
# 阶段8: 第8个月 (2025-09) - 每天提交，全天各时段
#         3天最活跃（大量提交）
# ============================================================
puts "\n【阶段8】第8个月 (2025-09) - 每天提交，全天各时段，3天最活跃"
puts '-' * 60

all_day_weights = [[0, 6, 3], [6, 12, 3], [12, 18, 3], [18, 24, 3]]

active_days = (1..30).to_a.sample(3)

(1..30).each do |day|
  if active_days.include?(day)
    num_commits = rand(3..8)
    num_commits.times do
      hour = weighted_random_hour(all_day_weights)
      min = random_minute
      sec = random_second
      ts = make_time(2025, 9, day, hour, min, sec)
      next unless ts
      lines = rand(50..500)
      make_commit(ts, lines)
      total_commits += 1
    end
  else
    hour = weighted_random_hour(all_day_weights)
    min = random_minute
    sec = random_second
    ts = make_time(2025, 9, day, hour, min, sec)
    next unless ts
    lines = rand(5..100)
    make_commit(ts, lines)
    total_commits += 1
  end
end

# ============================================================
# 阶段9: 2025-10 ~ 2025-12 持续提交到年底
# ============================================================
puts "\n【阶段9】2025-10 ~ 2025-12 - 持续到年底"
puts '-' * 60

[10, 11, 12].each do |month|
  days_in_month = Date.new(2025, month, -1).day
  commit_days = (1..days_in_month).to_a.sample(rand(5..10)).sort
  commit_days.each do |day|
    hour = weighted_random_hour([[0, 6, 2], [6, 12, 2], [12, 18, 3], [18, 24, 3]])
    min = random_minute
    sec = random_second
    ts = make_time(2025, month, day, hour, min, sec)
    next unless ts
    lines = rand(5..100)
    make_commit(ts, lines)
    total_commits += 1
  end
end

# ============================================================
# 完成
# ============================================================
puts "\n" + '=' * 60
puts "  全部完成！共 #{total_commits} 次提交"
puts '=' * 60

Dir.chdir(REPO_DIR) do
  puts "\nGit 提交总数:"
  system("git log --oneline | measure-object | Select-Object -ExpandProperty Count")
end